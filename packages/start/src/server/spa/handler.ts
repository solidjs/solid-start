import type { JSX } from "solid-js";

import { createBaseHandler } from "../handler.ts";
import { getSsrManifest } from "../manifest/ssr-manifest.ts";
import type { FetchEvent, HandlerOptions, PageEvent, StartHandler } from "../types.ts";
import { loadInitialData } from "./initial-data.ts";

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
  ctx.response.headers.set("Content-Type", "text/html");
  const manifest = getSsrManifest("ssr");
  const pageEvent: PageEvent = Object.assign(ctx, {
    manifest: "json" in manifest ? await manifest.json() : {},
    assets: await manifest.getAssets(import.meta.env.START_CLIENT_ENTRY),
    routes: [],
    complete: false,
    $islands: new Set<string>(),
  });

  if (import.meta.env.START_SSR_DATA) await loadInitialData(pageEvent);

  return pageEvent;
}
