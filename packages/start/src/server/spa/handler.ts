import type { JSX } from "solid-js";

import { createBaseHandler } from "../handler.ts";
import { getSsrManifest } from "../manifest/ssr-manifest.ts";
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
	const manifest = getSsrManifest("ssr");
	const pageEvent: PageEvent = Object.assign(ctx, {
		manifest: "json" in manifest ? await manifest.json() : {},
		assets: await manifest.getAssets(import.meta.env.START_CLIENT_ENTRY),
		routes: [],
		complete: false,
		$islands: new Set<string>(),
	});

	return pageEvent;
}
