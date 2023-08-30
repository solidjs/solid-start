import { createHandler as createBaseHandler } from "../handler";
import { FetchEvent, FETCH_EVENT, PageEvent } from "../types";

export function createHandler(
  fn: (context: PageEvent) => unknown,
  options?: { nonce?: string; renderId?: string; timeoutMs?: number }
) {
  return createBaseHandler(fn, { ...options, createPageEvent });
}

export async function createPageEvent(ctx: FetchEvent) {
  const clientManifest = import.meta.env.MANIFEST["client"];
  const pageEvent: PageEvent = {
    ...ctx,
    manifest: await clientManifest.json(),
    assets: [...(await clientManifest.inputs[clientManifest.handler].assets())],
    routes: [],
    prevUrl: "",
    routerContext: {} as any,
    mutation: false,
    tags: [],
    $type: FETCH_EVENT,
    $islands: new Set<string>()
  };

  return pageEvent;
}
