import type { JSX } from "@solidjs/web";

import { createBaseHandler } from "../handler.ts";
import type { FetchEvent, HandlerOptions, PageEvent } from "../types.ts";

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
    routes: [],
    complete: false,
    $islands: new Set<string>(),
  });

  return pageEvent;
}
