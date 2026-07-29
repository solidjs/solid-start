import type { JSX } from "@solidjs/web";

import { createBaseHandler } from "../handler.ts";
import type { FetchEvent, HandlerOptions, PageEvent, StartHandler } from "../types.ts";

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/create-handler
 */
export function createHandler(
  fn: (context: PageEvent) => JSX.Element,
  options?: HandlerOptions | ((context: PageEvent) => HandlerOptions),
  routerLoad?: (event: FetchEvent) => Promise<void>,
): StartHandler {
  return createBaseHandler(createPageEvent, fn, options, routerLoad);
}

async function createPageEvent(ctx: FetchEvent) {
  const pageEvent: PageEvent = Object.assign(ctx, {
    complete: false,
    $islands: new Set<string>(),
  });

  return pageEvent;
}
