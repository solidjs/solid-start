import type { JSX } from "solid-js";

import { createHandler as createBaseHandler } from "../index";
import { getClientEntryCssTags } from "../server-manifest";
import type { FetchEvent, HandlerOptions, PageEvent } from "../types";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/create-handler
 */
export function createHandler(
  fn: (context: PageEvent) => JSX.Element,
  options?: HandlerOptions | ((context: PageEvent) => HandlerOptions),
) {
  return createBaseHandler(fn, options);
}

export async function createPageEvent(ctx: FetchEvent) {
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: {},
    assets: [...(await getClientEntryCssTags())],
    routes: [],
    complete: false,
    $islands: new Set<string>(),
  });

  return pageEvent;
}
