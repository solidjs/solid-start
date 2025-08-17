import {
  eventHandler,
  getCookie,
  getResponseHeaders,
  H3Event,
  sendStream,
  sendWebResponse,
  setCookie
} from "h3";
import { provideRequestEvent } from "solid-js/web/storage";
import type { JSX } from "solid-js";
import { renderToStream, renderToString, renderToStringAsync } from "solid-js/web";
import { manifest } from "solid-start:server-manifest";
import { join } from "pathe";

import { sharedConfig } from "solid-js";
// import { handleServerFunction } from "./server-functions-handler";
import { getFetchEvent } from "./fetchEvent.js";
import { matchAPIRoute } from "./routes.js";
import { APIEvent, FetchEvent, HandlerOptions, PageEvent } from "./types.js";
// import { createProdManifest } from "./prodManifest.js";
export { StartServer } from "./StartServer.jsx";
import { createRoutes } from "../router.jsx";
import { handleServerFunction } from "./server-functions-handler.js";
import { getClientEntryCssTags } from "./server-manifest.js";

const SERVER_FN_BASE = "/_server";

/**
 * Checks if user has set a redirect status in the response.
 * If not, falls back to the 302 (temporary redirect)
 */
// export function getExpectedRedirectStatus(response: ResponseStub): number {
//   if (response.status && validRedirectStatuses.has(response.status)) {
//     return response.status;
//   }

//   return 302;
// }

function initFromFlash(ctx: FetchEvent) {
  const flash = getCookie(ctx.nativeEvent, "flash");
  if (!flash) return;
  try {
    let param = JSON.parse(flash);
    if (!param || !param.result) return;
    const input = [...param.input.slice(0, -1), new Map(param.input[param.input.length - 1])];
    const result = param.error ? new Error(param.result) : param.result;
    return {
      input,
      url: param.url,
      pending: false,
      result: param.thrown ? undefined : result,
      error: param.thrown ? result : undefined
    };
  } catch (e) {
    console.error(e);
  } finally {
    setCookie(ctx.nativeEvent, "flash", "", { maxAge: 0 });
  }
}

export async function createPageEvent(ctx: FetchEvent) {
  // const clientManifest = import.meta.env.MANIFEST["client"]!;
  // const serverManifest = import.meta.env.MANIFEST["server"]!;
  // ctx.response.headers.set("Content-Type", "text/html");
  // const prevPath = ctx.request.headers.get("x-solid-referrer");
  // const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: manifest.clientAssetManifest,
    assets: [
      ...getClientEntryCssTags()
      // not needed anymore?
      // ...(import.meta.env.DEV
      //   ? await clientManifest.inputs[import.meta.env.START_APP]!.assets()
      //   : []),
      // ...(import.meta.env.START_ISLANDS
      //   ? (await serverManifest.inputs[serverManifest.handler]!.assets()).filter(
      //       s => (s as any).attrs.rel !== "modulepreload"
      //     )
      //   : [])
    ],
    router: {
      submission: initFromFlash(ctx) as any
    },
    routes: createRoutes(),
    //   // prevUrl: prevPath || "",
    //   // mutation: mutation,
    //   // $type: FETCH_EVENT,
    complete: false,
    $islands: new Set<string>()
  });

  return pageEvent;
}

export function createHandler(
  fn: (context: PageEvent) => JSX.Element,
  options: HandlerOptions | ((context: PageEvent) => HandlerOptions | Promise<HandlerOptions>) = {}
) {
  return eventHandler(async (e: H3Event) => {
    const event = getFetchEvent(e);

    return await provideRequestEvent(event, async () => {
      const url = new URL(event.request.url);
      const pathname = url.pathname;

      const serverFunctionTest = join("/", SERVER_FN_BASE);
      if (pathname.startsWith(serverFunctionTest)) {
        const serverFnResponse = await handleServerFunction(e);

        if (serverFnResponse instanceof Response) return serverFnResponse;

        return new Response(serverFnResponse as any, {
          headers: getResponseHeaders(e) as any
        });
      }

      const match = matchAPIRoute(pathname, event.request.method);
      if (match) {
        const mod = await match.handler.import();
        const fn =
          event.request.method === "HEAD" ? mod["HEAD"] || mod["GET"] : mod[event.request.method];
        (event as APIEvent).params = match.params || {};
        // @ts-ignore
        sharedConfig.context = { event };
        const res = await fn!(event);
        if (res !== undefined) return res;
        if (event.request.method !== "GET") {
          throw new Error(
            `API handler for ${event.request.method} "${event.request.url}" did not return a response.`
          );
        }
      }

      const context = await createPageEvent(event);

      const resolvedOptions =
        typeof options === "function" ? await options(context) : { ...options };
      const mode = resolvedOptions.mode || "stream";
      if (resolvedOptions.nonce) context.nonce = resolvedOptions.nonce;

      if (mode === "sync" || !import.meta.env.START_SSR) {
        const html = renderToString(() => {
          (sharedConfig.context as any).event = context;
          return fn(context);
        });
        context.complete = true;

        // insert redirect handling here

        return html;
      }

      const stream = renderToStream(() => {
        (sharedConfig.context as any).event = context;
        return fn(context);
      }, resolvedOptions);

      // insert redirect handling here

      if (mode === "async") return stream as unknown as Promise<string>; // stream has a hidden 'then' method

      // fix cloudflare streaming
      const { writable, readable } = new TransformStream();
      stream.pipeTo(writable);
      return readable;
    });
  });
}
