import type { JSX } from "solid-js";
import { getSsrManifest } from "solid-start:get-ssr-manifest";

import { createBaseHandler } from "../handler.js";
import { getClientEntryCssTags } from "../server-manifest.js";
import type { FetchEvent, HandlerOptions, PageEvent } from "../types.js";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/create-handler
 */
export function createHandler(
  fn: (context: PageEvent) => JSX.Element,
  options?: HandlerOptions | ((context: PageEvent) => HandlerOptions),
) {
  return createBaseHandler(createPageEvent, fn, options);
}

async function createPageEvent(ctx: FetchEvent) {
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: getSsrManifest(false),
    assets: await getClientEntryCssTags(),
    routes: [],
    complete: false,
    $islands: new Set<string>(),
  });

  return pageEvent;
}
