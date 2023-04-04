import { once } from "events";
import multipart from "parse-multipart-data";
import { splitCookiesString } from "set-cookie-parser";
import { Readable } from "stream";
import { File, FormData, Headers, Request as BaseNodeRequest } from "undici";

function nodeToWeb(nodeStream) {
  var destroyed = false;
  var listeners = {};

  function start(controller) {
    listeners["data"] = onData;
    listeners["end"] = onData;
    listeners["end"] = onDestroy;
    listeners["close"] = onDestroy;
    listeners["error"] = onDestroy;
    for (var name in listeners) nodeStream.on(name, listeners[name]);

    nodeStream.pause();

    function onData(chunk) {
      if (destroyed) return;
      controller.enqueue(chunk);
      nodeStream.pause();
    }

    function onDestroy(err) {
      if (destroyed) return;
      destroyed = true;

      for (var name in listeners) nodeStream.removeListener(name, listeners[name]);

      if (err) controller.error(err);
      else controller.close();
    }
  }

  function pull() {
    if (destroyed) return;
    nodeStream.resume();
  }

  function cancel() {
    destroyed = true;

    for (var name in listeners) nodeStream.removeListener(name, listeners[name]);

    nodeStream.push(null);
    nodeStream.pause();
    if (nodeStream.destroy) nodeStream.destroy();
    else if (nodeStream.close) nodeStream.close();
  }

  return new ReadableStream({ start: start, pull: pull, cancel: cancel });
}

function createHeaders(requestHeaders) {
  let headers = new Headers();

  for (let [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (const value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

class NodeRequest extends BaseNodeRequest {
  constructor(input, init) {
    if (init && init.data && init.data.on) {
      init = {
        duplex: "half",
        ...init,
        body: init.data.headers["content-type"]?.includes("x-www")
          ? init.data
          : nodeToWeb(init.data)
      };
    }

    super(input, init);
  }

  // async json() {
  //   return JSON.parse(await this.text());
  // }

  async buffer() {
    return Buffer.from(await super.arrayBuffer());
  }

  // async text() {
  //   return (await this.buffer()).toString();
  // }

  // @ts-ignore
  async formData() {
    if (this.headers.get("content-type") === "application/x-www-form-urlencoded") {
      return await super.formData();
    } else {
      const data = await this.buffer();
      const input = multipart.parse(
        data,
        this.headers.get("content-type").replace("multipart/form-data; boundary=", "")
      );
      const form = new FormData();
      input.forEach(({ name, data, filename, type }) => {
        // file fields have Content-Type set,
        // whereas non-file fields must not
        // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#multipart-form-data
        const isFile = type !== undefined;
        if (isFile) {
          const value = new File([data], filename, { type });
          form.append(name, value, filename);
        } else {
          const value = data.toString("utf-8");
          form.append(name, value);
        }
      });
      return form;
    }
  }

  // @ts-ignore
  clone() {
    /** @type {BaseNodeRequest & { buffer?: () => Promise<Buffer>; formData?: () => Promise<FormData> }}  */
    let el = super.clone();
    el.buffer = this.buffer.bind(el);
    el.formData = this.formData.bind(el);
    return el;
  }
}

/**
 *
 * @param {import('http').IncomingMessage} req
 */
export function createRequest(req) {
  let origin;
  if (req.httpVersionMajor === 1) {
    origin = req.headers.origin && 'null' !== req.headers.origin
      ? req.headers.origin
      : `http://${req.headers.host}`;
    // It's impossible for `host` to be empty since :authority doesn't exist on HTTP/1.
    // https://www.rfc-editor.org/rfc/rfc9110.html#section-7.2 A user agent MUST generate a Host header field in a request unless it sends that information as an ":authority" pseudo-header field
    // We initially try the origin header because it has the scheme. The host header doesn't, and so defaults to HTTP
  } else if (req.httpVersionMajor === 2) {
    const scheme = req.headers[":scheme"] || "http"; // optimistically assuming http if CONNECT https://www.rfc-editor.org/rfc/rfc7540#section-8.1.2.3 All HTTP/2 requests MUST include exactly one valid value for the ":method", ":scheme", and ":path" pseudo-header fields, unless it is a CONNECT request
    const host = req.headers[":authority"] || req.headers.host; // :authority may not exist if the server isn't authoritative; fall back to host https://www.rfc-editor.org/rfc/rfc7540#section-8.2 The server MUST include a value in the ":authority" pseudo-header field for which the server is authoritative
    origin = `${scheme}://${host}`;
  } else if (req.httpVersionMajor === 3) {
    const scheme = req.headers[":scheme"] || "http"; // optimistically assuming http if CONNECT https://www.rfc-editor.org/rfc/rfc9114.html#section-4.3.1 All HTTP/3 requests MUST include exactly one value for the :method, :scheme, and :path pseudo-header fields, unless the request is a CONNECT request
    const host = req.headers[":authority"] || req.headers.host; // :authority or host must exist https://www.rfc-editor.org/rfc/rfc9114.html#section-4.3.1 If the :scheme pseudo-header field identifies a scheme that has a mandatory authority component (including "http" and "https"), the request MUST contain either an :authority pseudo-header field or a Host header field.
    origin = `${scheme}://${host}`;
  } else {
    throw new Error(`Unsupported HTTP version: '${req.httpVersionMajor}'`);
  }

  let url = new URL(req.url, origin);

  let init = {
    method: req.method,
    headers: createHeaders(req.headers),
    // POST, PUT, & PATCH will be read as body by NodeRequest
    data: req.method.indexOf("P") === 0 ? req : null
  };

  return new NodeRequest(url.href, init);
}

export async function handleNodeResponse(webRes, res) {
  res.statusCode = webRes.status;
  res.statusMessage = webRes.statusText;

  for (const [name, value] of webRes.headers) {
    if (name === "set-cookie") {
      res.setHeader(name, splitCookiesString(value));
    } else res.setHeader(name, value);
  }

  if (webRes.body) {
    const readable = Readable.from(webRes.body);
    readable.pipe(res);
    await once(readable, "end");
  } else {
    res.end();
  }
}

export { splitCookiesString };

