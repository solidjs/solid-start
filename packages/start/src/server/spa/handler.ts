import type { JSX } from "solid-js";

import { createBaseHandler } from "../handler.js";
import type { FetchEvent, HandlerOptions, PageEvent } from "../types.js";
import { getSsrManifest } from "../manifest/ssr-manifest.js";

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
  const manifest = getSsrManifest('client');
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: 'json' in manifest ? await manifest.json() : {},
    assets: await manifest.getAssets(import.meta.env.START_CLIENT_ENTRY),
    routes: [],
    complete: false,
    $islands: new Set<string>(),
  });

  return pageEvent;
}
