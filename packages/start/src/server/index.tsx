import { eventHandler, getResponseHeaders, H3Event, sendStream, sendWebResponse } from "h3";
import { provideRequestEvent } from "solid-js/web/storage";
import type { JSX } from "solid-js";
import { renderToStringAsync } from "solid-js/web";
import { manifest } from "solid-start:server-manifest";
import { join } from "pathe";

import { sharedConfig } from "solid-js";
// import { handleServerFunction } from "./server-functions-handler";
import { getFetchEvent } from "./fetchEvent.js";
import { matchAPIRoute } from "./routes.js";
import { FetchEvent, PageEvent } from "./types.js";
// import { createProdManifest } from "./prodManifest.js";
export { StartServer } from "./StartServer.jsx";
import { createRoutes } from "../router.jsx";
import { handleServerFunction } from "./server-functions-handler.js";
import { getClientEntryCssTags } from "./server-manifest.js";

const SERVER_FN_BASE = "/_server";

async function createPageEvent(ctx: FetchEvent) {
  // const clientManifest = import.meta.env.MANIFEST["client"]!;
  // const serverManifest = import.meta.env.MANIFEST["server"]!;
  // ctx.response.headers.set("Content-Type", "text/html");
  // const prevPath = ctx.request.headers.get("x-solid-referrer");
  // const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: manifest.routes,
    assets: [
      ...(await getClientEntryCssTags())
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
    //   router: {
    //     // submission: initFromFlash(ctx) as any
    //   },
    routes: createRoutes()
    //   // prevUrl: prevPath || "",
    //   // mutation: mutation,
    //   // $type: FETCH_EVENT,
    //   complete: false,
    //   $islands: new Set<string>()
  });

  return pageEvent;
}

export function createHandler(fn: (context: PageEvent) => JSX.Element) {
  // if (import.meta.env.PROD) createProdManifest();

  return eventHandler(async (e: H3Event) => {
    const fetchEvent = getFetchEvent(e);

    return await provideRequestEvent(fetchEvent, async () => {
      const url = new URL(fetchEvent.request.url);
      const pathname = url.pathname;

      const serverFunctionTest = join("/", SERVER_FN_BASE);
      if (pathname.startsWith(serverFunctionTest)) {
        const serverFnResponse = await handleServerFunction(e);

        // console.log({ serverFnResponse });

        if (serverFnResponse instanceof Response) return serverFnResponse;

        const resp = new Response(serverFnResponse, { headers: getResponseHeaders(e) });

        return resp;
      }

      const match = matchAPIRoute(pathname, fetchEvent.request.method);
      if (match) return;

      const context = await createPageEvent(fetchEvent);
      const html = await renderToStringAsync(() => {
        (sharedConfig.context as any).event = context;
        return fn(context);
      });

      return new Response(html, { headers: { "content-type": "text/html" } });
    });
  });
}
