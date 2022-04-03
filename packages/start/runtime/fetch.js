import { Request as BaseNodeRequest, Headers } from "undici";
import { FormData } from "undici";
import multipart from "parse-multipart-data";
import stream from "stream";
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
        ...init,
        body: init.data.headers["content-type"].includes("x-www")
          ? init.data
          : stream.Readable.toWeb(init.data)
      };
    }

    super(input, init);

    this._body = init.data;
  }

  _body;

  cachedBuffer;

  async json() {
    return JSON.parse(await this.text());
  }

  async buffer() {
    if (this.cachedBuffer) {
      return this.cachedBuffer;
    }
    return await new Promise((resolve, reject) => {
      let chunks = [];
      this._body.on("data", chunk => {
        chunks.push(chunk);
      });
      this._body.on("end", () => {
        this.cachedBuffer = Buffer.concat(chunks);
        resolve(this.cachedBuffer);
      });
      this._body.on("error", reject);
    });
  }

  async text() {
    return (await this.buffer()).toString();
  }

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
      input.forEach(({ name, data }) => {
        form.set(name, data);
      });
      return form;
    }
  }
}

export function createRequest(req) {
  let origin = req.headers.origin || `http://${req.headers.host}`;
  let url = new URL(req.url, origin);

  let init = {
    method: req.method,
    headers: createHeaders(req.headers),
    // POST, PUT, & PATCH will be read as body by NodeRequest
    data: req.method.indexOf("P") === 0 ? req : null
  };

  return new NodeRequest(url.href, init);
}
