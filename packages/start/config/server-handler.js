/// <reference types="vinxi/types/server" />
import { crossSerializeStream, fromJSON, getCrossReferenceHeader } from "seroval";
import {
  CustomEventPlugin,
  DOMExceptionPlugin,
  EventPlugin,
  FormDataPlugin,
  HeadersPlugin,
  ReadableStreamPlugin,
  RequestPlugin,
  ResponsePlugin,
  URLPlugin,
  URLSearchParamsPlugin
} from "seroval-plugins/web";
import { provideRequestEvent } from "solid-js/web/storage";
import invariant from "vinxi/lib/invariant";
import {
  eventHandler,
  getHeader,
  getRequestURL,
  readBody,
  readRawBody,
  setHeader
} from "vinxi/server";
import { getFetchEvent } from "../server/middleware";

function serializeToStream(id, value) {
  return new ReadableStream({
    start(controller) {
      crossSerializeStream(value, {
        scopeId: id,
        plugins: [
          CustomEventPlugin,
          DOMExceptionPlugin,
          EventPlugin,
          FormDataPlugin,
          HeadersPlugin,
          ReadableStreamPlugin,
          RequestPlugin,
          ResponsePlugin,
          URLSearchParamsPlugin,
          URLPlugin
        ],
        onSerialize(data, initial) {
          const result = initial ? `(${getCrossReferenceHeader(id)},${data})` : data;
          controller.enqueue(new TextEncoder().encode(`${result};\n`));
        },
        onDone() {
          // controller.enqueue(`delete $R["${id}"];\n`);
          controller.close();
        },
        onError(error) {
          // controller.enqueue(`delete $R["${id}"];\n`);
          controller.error(error);
        }
      });
    }
  });
}

async function handleServerFunction(event) {
  invariant(event.method === "POST", `Invalid method ${event.method}. Expected POST.`);

  const serverReference = getHeader(event, "x-server-id");
  const instance = getHeader(event, "x-server-instance");
  const url = getRequestURL(event);
  let filepath, name;
  if (serverReference) {
    invariant(typeof serverReference === "string", "Invalid server function");
    [filepath, name] = serverReference.split("#");
  } else {
    filepath = url.searchParams.get("id");
    name = url.searchParams.get("name");
    if (!filepath || !name) throw new Error("Invalid request");
  }

  const action = (
    await import.meta.env.MANIFEST[import.meta.env.ROUTER_NAME].chunks[filepath].import()
  )[name];
  let parsed = [];

  // grab bound arguments from url when no JS
  if (!instance) {
    const args = url.searchParams.get("args");
    if (args) JSON.parse(args).forEach(arg => parsed.push(arg));
  }
  const contentType = getHeader(event, "content-type");
  if (
    contentType.startsWith("multipart/form-data") ||
    contentType.startsWith("application/x-www-form-urlencoded")
  ) {
    // Temporary workaround until https://github.com/unjs/nitro/issues/1721 is resolved
    // parsed.push(await readFormData(event));

    const request = new Request(getRequestURL(event), {
      method: event.method,
      headers: event.headers,
      body: await readRawBody(event)
    });
    parsed.push(await request.formData());
  } else {
    parsed = fromJSON(await readBody(event), {
      plugins: [
        CustomEventPlugin,
        DOMExceptionPlugin,
        EventPlugin,
        FormDataPlugin,
        HeadersPlugin,
        ReadableStreamPlugin,
        RequestPlugin,
        ResponsePlugin,
        URLSearchParamsPlugin,
        URLPlugin
      ]
    });
  }
  try {
    const result = await provideRequestEvent(getFetchEvent(event), () => action(...parsed));

    // handle no JS success case
    if (!instance) {
      const isError = result instanceof Error;
      const refererUrl = new URL(getHeader(event, "referer"));
      return new Response(null, {
        status: 302,
        headers: {
          Location: refererUrl.toString(),
          ...(result
            ? {
                "Set-Cookie": `flash=${JSON.stringify({
                  url: url.pathname + encodeURIComponent(url.search),
                  result: isError ? result.message : result,
                  error: isError,
                  input: [...parsed.slice(0, -1), [...parsed[parsed.length - 1].entries()]]
                })}; Secure; HttpOnly;`
              }
            : {})
        }
      });
    }

    setHeader(event, "content-type", "text/javascript");
    return serializeToStream(instance, result);
  } catch (x) {
    if (x instanceof Response && x.status === 302) {
      return new Response(null, {
        status: instance ? 204 : 302,
        headers: {
          Location: x.headers.get("Location")
        }
      });
    }
    return new Response(serializeToStream(instance, x), {
      status: 500,
      headers: {
        "Content-Type": "text/javascript"
      }
    });
  }
}

export default eventHandler(handleServerFunction);
