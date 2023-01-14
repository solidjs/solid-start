import { MiniflareOptions } from "miniflare";

/**
 * Create a Cloudflare Workers adapter.
 * @param {MiniflareOptions} props - Options to pass to Miniflare - e.g. when using `solid-start dev`. See https://miniflare.dev/get-started/api
 * @example
 * // Miniflare will import `.env` from the current working directory.
 * import solid from "solid-start/vite"
 * import cloudflare from "solid-start-cloudflare-workers"
 * solid({
      adapter: cloudflare({ envPath: true }),
   })
 */
export default function (
  props: MiniflareOptions & {
    include?: string | string[];
  }
): import("solid-start/vite").Adapter;
