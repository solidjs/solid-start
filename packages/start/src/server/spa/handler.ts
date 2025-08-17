import type { JSX } from "solid-js";
import { manifest } from "solid-start:server-manifest";
import { createRoutes } from "../../router";
import { createHandler as createBaseHandler } from "../index";
import { getClientEntryCssTags } from "../server-manifest";
import { FetchEvent, HandlerOptions, PageEvent } from "../types";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/create-handler
 */
export function createHandler(
  fn: (context: PageEvent) => JSX.Element,
  options?: HandlerOptions | ((context: PageEvent) => HandlerOptions)
) {
  return createBaseHandler(fn, options);
}

export async function createPageEvent(ctx: FetchEvent) {
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
    routes: createRoutes(),
    //   // prevUrl: prevPath || "",
    //   // mutation: mutation,
    //   // $type: FETCH_EVENT,
    complete: false,
    $islands: new Set<string>()
  });

  return pageEvent;
}
