/// <reference types="vinxi/types/server" />
import { crossSerializeStream, fromJSON, getCrossReferenceHeader } from "seroval";
// @ts-ignore
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
import { renderToString } from "solid-js/web";
import { provideRequestEvent } from "solid-js/web/storage";
import { eventHandler, setHeader, setResponseStatus, type H3Event } from "vinxi/http";
import invariant from "vinxi/lib/invariant";
import { cloneEvent, getFetchEvent, mergeResponseHeaders } from "../server/fetchEvent";
import { createPageEvent } from "../server/pageEvent";
// @ts-ignore
import App from "#start/app";
import { FetchEvent, PageEvent } from "../server";

function createChunk(data: string) {
  const bytes = data.length;
  const baseHex = bytes.toString(16);
  const totalHex = "00000000".substring(0, 8 - baseHex.length) + baseHex; // 32-bit
  return new TextEncoder().encode(`;0x${totalHex};${data}`);
}

function serializeToStream(id: string, value: any) {
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

async function handleServerFunction(h3Event: H3Event) {
  const event = getFetchEvent(h3Event);
  const request = event.request;

  const serverReference = request.headers.get("X-Server-Id");
  const instance = request.headers.get("X-Server-Instance");
  const singleFlight = request.headers.has("X-Single-Flight");
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

  const serverFunction = (
    await import.meta.env.MANIFEST[import.meta.env.ROUTER_NAME]!.chunks[filepath!]!.import()
  )[name!];
  let parsed: any[] = [];

  // grab bound arguments from url when no JS
  if (!instance || h3Event.method === "GET") {
    const args = url.searchParams.get("args");
    if (args) JSON.parse(args).forEach((arg: any) => parsed.push(arg));
  }
  if (h3Event.method === "POST") {
    const contentType = request.headers.get("content-type");
    if (
      contentType?.startsWith("multipart/form-data") ||
      contentType?.startsWith("application/x-www-form-urlencoded")
    ) {
      // workaround for https://github.com/unjs/nitro/issues/1721
      // (issue only in edge runtimes)
      parsed.push(
        await new Request(request, { ...request, body: (h3Event.node.req as any).body }).formData()
      );
      // what should work when #1721 is fixed
      // parsed.push(await request.formData);
    } else if (contentType?.startsWith("application/json")) {
      // workaround for https://github.com/unjs/nitro/issues/1721
      // (issue only in edge runtimes)
      const tmpReq = new Request(request, { ...request, body: (h3Event.node.req as any).body });
      // what should work when #1721 is fixed
      // just use request.json() here
      parsed = fromJSON(await tmpReq.json(), {
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
    let result = await provideRequestEvent(event, async () => {
      /* @ts-ignore */
      sharedConfig.context = { event };
      return serverFunction(...parsed);
    });

    if (singleFlight && instance) {
      result = await handleSingleFlight(event, result);
    }

    // handle responses
    if (result instanceof Response && instance) {
      // forward headers
      if (result.headers) mergeResponseHeaders(h3Event, result.headers);
      if ((result as any).customBody) {
        result = await (result as any).customBody();
      } else if (result.body == undefined) result = null;
    }

    // handle no JS success case
    if (!instance) {
      const isError = result instanceof Error;
      let redirectUrl = new URL(request.headers.get("referer")!).toString();
      if (result instanceof Response && result.headers.has("Location")) {
        redirectUrl = new URL(
          result.headers.get("Location")!,
          new URL(request.url).origin + import.meta.env.SERVER_BASE_URL
        ).toString();
      }
      return new Response(null, {
        status: 302,
        headers: {
          Location: redirectUrl,
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
    setHeader(h3Event, "content-type", "text/javascript");
    return serializeToStream(instance, result);
  } catch (x) {
    if (x instanceof Response) {
      if (singleFlight && instance) {
        x = await handleSingleFlight(event, x);
      }
      if ((x as any).status === 302 && !instance) setResponseStatus(h3Event, 302);
      // forward headers
      if ((x as any).headers) mergeResponseHeaders(h3Event, (x as any).headers);
      if ((x as any).customBody) {
        x = (x as any).customBody();
      } else if ((x as any).body == undefined) x = null;
      if (instance) {
        setHeader(h3Event, "content-type", "text/javascript");
        return serializeToStream(instance, x);
      }
    }
    return x;
  }
}

async function handleSingleFlight(sourceEvent: FetchEvent, result: any): Promise<Response> {
  let revalidate: string[];
  let url = new URL(sourceEvent.request.headers.get("referer")!).toString();
  if (result instanceof Response) {
    if (result.headers.has("X-Revalidate"))
      revalidate = result.headers.get("X-Revalidate")!.split(",");
    if (result.headers.has("Location"))
      url = new URL(
        result.headers.get("Location")!,
        new URL(sourceEvent.request.url).origin + import.meta.env.SERVER_BASE_URL
      ).toString();
  }
  const event = cloneEvent(sourceEvent) as PageEvent;
  event.request = new Request(url);
  return await provideRequestEvent(event, async () => {
    await createPageEvent(event);
    /* @ts-ignore */
    event.router.dataOnly = revalidate || true;
    /* @ts-ignore */
    event.router.previousUrl = sourceEvent.request.headers.get("referer");
    try {
      renderToString(() => {
        /* @ts-ignore */
        sharedConfig.context.event = event;
        App();
      });
    } catch (e) {
      console.log(e);
    }

    /* @ts-ignore */
    const body = event.router.data;
    if (!body) return result;
    let containsKey = false;
    for (const key in body) {
      if (body[key] === undefined) delete body[key];
      else containsKey = true;
    }
    if (!containsKey) return result;
    if (!(result instanceof Response)) {
      body["_$value"] = result;
      result = new Response(null, { status: 200 });
    } else if ((result as any).customBody) {
      body["_$value"] = (result as any).customBody();
    }
    result.customBody = () => body;
    result.headers.set("X-Single-Flight", "true");
    return result;
  });
}

export default eventHandler(handleServerFunction);
