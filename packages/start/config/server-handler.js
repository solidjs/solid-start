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
import { sharedConfig } from "solid-js";
/* @ts-ignore */
import { provideRequestEvent } from "solid-js/web/storage";
import invariant from "vinxi/lib/invariant";
import { eventHandler, setHeader } from "vinxi/server";
import { getFetchEvent } from "../server/middleware";

function createChunk(data) {
  const bytes = data.length;
  const baseHex = bytes.toString(16);
  const totalHex = "00000000".substring(0, 8 - baseHex.length) + baseHex; // 32-bit
  return new TextEncoder().encode(`;0x${totalHex};${data}`);
}

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
          controller.enqueue(
            createChunk(initial ? `(${getCrossReferenceHeader(id)},${data})` : data)
          );
        },
        onDone() {
          controller.close();
        },
        onError(error) {
          controller.error(error);
        }
      });
    }
  });
}

async function handleServerFunction(h3Event) {
  const event = getFetchEvent(h3Event);
  const request = event.request;

  const serverReference = request.headers.get("x-server-id");
  const instance = request.headers.get("x-server-instance");
  const url = new URL(request.url);
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
  if (!instance || h3Event.method === "GET") {
    const args = url.searchParams.get("args");
    if (args) JSON.parse(args).forEach(arg => parsed.push(arg));
  }
  if (h3Event.method === "POST") {
    const contentType = request.headers.get("content-type");
    if (
      contentType.startsWith("multipart/form-data") ||
      contentType.startsWith("application/x-www-form-urlencoded")
    ) {
      parsed.push(await request.formData());
    } else {
      parsed = fromJSON(await request.json(), {
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
  }
  try {
    const result = await provideRequestEvent(event, () => {
      /* @ts-ignore */
      sharedConfig.context = { event };
      return action(...parsed);
    });

    // handle no JS success case
    if (!instance) {
      const isError = result instanceof Error;
      const refererUrl = new URL(request.headers.get("referer"));
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
    if (typeof result === "string") return new Response(result);
    setHeader(h3Event, "content-type", "text/javascript");
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
    return x;
  }
}

export default eventHandler(handleServerFunction);
