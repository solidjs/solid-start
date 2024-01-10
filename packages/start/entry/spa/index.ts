import { createBaseHandler } from "..";
import { FetchEvent, PageEvent } from "../../server/types";

export function createHandler(
  fn: (context: PageEvent) => unknown,
  options?: { nonce?: string; renderId?: string; timeoutMs?: number }
) {
  return createBaseHandler(fn, { ...options, createPageEvent });
}

export async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"];
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: await clientManifest.json(),
    assets: [...(await clientManifest.inputs[clientManifest.handler].assets())],
    routes: [],
    // prevUrl: "",
    // mutation: false,
    // $type: FETCH_EVENT,
    $islands: new Set<string>()
  });

  return pageEvent;
}
