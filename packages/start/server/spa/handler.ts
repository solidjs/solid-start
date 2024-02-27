import { createBaseHandler } from "../handler";
import { FetchEvent, HandlerOptions, PageEvent } from "../types";

export function createHandler(
  fn: (context: PageEvent) => unknown,
  options?: HandlerOptions | ((context: PageEvent) => HandlerOptions)
) {
  return createBaseHandler(fn, createPageEvent, options);
}

export async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"]!;
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: await clientManifest.json(),
    assets: [...(await clientManifest.inputs[clientManifest.handler]!.assets())],
    routes: [],
    // prevUrl: "",
    // mutation: false,
    // $type: FETCH_EVENT,
    $islands: new Set<string>()
  });

  return pageEvent;
}
