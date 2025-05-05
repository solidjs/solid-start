import { eventHandler, H3Event } from "h3";
import { provideRequestEvent } from "solid-js/web/storage";

// import { handleServerFunction } from "./server-functions-handler";
import { getFetchEvent } from "./fetchEvent.js";
import { matchAPIRoute } from "./routes.js";
import { FetchEvent, PageEvent } from "./types.js";
import { JSX } from "solid-js/h/jsx-runtime";
import { createRoutes } from "../router.js";
import { renderToString } from "solid-js/web";
import { sharedConfig } from "solid-js";

export { StartServer } from "./StartServer.jsx";

const SERVER_FN_BASE = "/_server";

if (import.meta.env.PROD) {
  (globalThis as any).MANIFEST = {};
}

async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"]!;
  const serverManifest = import.meta.env.MANIFEST["server"]!;
  ctx.response.headers.set("Content-Type", "text/html");
  // const prevPath = ctx.request.headers.get("x-solid-referrer");
  // const mutation = ctx.request.headers.get("x-solid-mutation") === "true";
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: {}, // await clientManifest.json(),
    assets: [
      // ...(await clientManifest.inputs[clientManifest.handler]!.assets())
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
      // submission: initFromFlash(ctx) as any
    },
    routes: createRoutes(),
    // prevUrl: prevPath || "",
    // mutation: mutation,
    // $type: FETCH_EVENT,
    complete: false,
    $islands: new Set<string>()
  });

  return pageEvent;
}

export function createHandler(fn: (context: PageEvent) => JSX.Element) {
  return eventHandler(async (e: H3Event) => {
    const fetchEvent = getFetchEvent(e);

    return await provideRequestEvent(fetchEvent, async () => {
      const url = new URL(fetchEvent.request.url);
      const pathname = url.pathname;

      // const serverFunctionTest = path.join("/", SERVER_FN_BASE, "/");
      // if (pathname.startsWith(serverFunctionTest)) return await handleServerFunction(e);

      const match = matchAPIRoute(pathname, fetchEvent.request.method);
      if (match) return;

      const context = await createPageEvent(fetchEvent);
      const html = renderToString(() => {
        (sharedConfig.context as any).event = context;
        return fn(context);
      });

      return new Response(html, { headers: { "content-type": "text/html" } });
    });
  });
}
