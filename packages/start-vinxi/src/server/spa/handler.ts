import { createBaseHandler } from "../handler";
import { FetchEvent, HandlerOptions, PageEvent } from "../types";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/create-handler
 */
export function createHandler(
  fn: (context: PageEvent) => unknown,
  options?: HandlerOptions | ((context: PageEvent) => HandlerOptions),
  routerLoad?: (event: FetchEvent) => Promise<void>
) {
  return createBaseHandler(fn, createPageEvent, options, routerLoad);
}

export async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"]!;
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: await clientManifest.json(),
    assets: [...(await clientManifest.inputs[clientManifest.handler]!.assets())],
    routes: [],
    complete: false,
    // prevUrl: "",
    // mutation: false,
    // $type: FETCH_EVENT,
    $islands: new Set<string>()
  });

  return pageEvent;
}
