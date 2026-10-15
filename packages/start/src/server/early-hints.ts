import { writeEarlyHints } from "h3";
import type { Asset } from "./assets/render.tsx";
import type { FetchEvent } from "./types.ts";

/**
 * Turns the page's `<link>` assets into `Link` header values: stylesheets as
 * `preload` and scripts as `modulepreload`, the same way the page links them.
 */
export function toLinkValues(assets: Asset[]): string[] {
  const links: string[] = [];
  for (const asset of assets) {
    if (asset.tag !== "link") continue;
    const { href, rel } = asset.attrs;
    if (typeof href !== "string") continue;
    // Header values must be ASCII, and a chunk name can contain any character
    // a route file name can.
    const target = `<${encodeURI(href)}>`;
    if (rel === "stylesheet") links.push(`${target}; rel=preload; as=style`);
    else if (rel === "modulepreload") links.push(`${target}; rel=modulepreload`);
  }
  return links;
}

/**
 * Sends the assets as `103 Early Hints` when the server runs on Node, or adds
 * them as `Link` headers on the response otherwise. Only in production, and
 * only when the `earlyHints` option is on.
 *
 * Hints only help before the response headers are sent, so this does nothing
 * once they are.
 *
 * @see https://github.com/solidjs/solid-start/issues/1935
 */
export function sendEarlyHints(event: FetchEvent, assets: Asset[]): void {
  if (!import.meta.env.PROD || !import.meta.env.START_EARLY_HINTS) return;
  if (event.nativeEvent.runtime?.node?.res?.headersSent) return;
  const links = toLinkValues(assets);
  if (links.length === 0) return;
  void writeEarlyHints(event.nativeEvent, { link: links });
}
