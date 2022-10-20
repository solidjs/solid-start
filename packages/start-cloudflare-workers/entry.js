import { getAssetFromKV, MethodNotAllowedError, NotFoundError } from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import manifest from "../../dist/public/route-manifest.json";
import handler from "./handler";

/**
 * @example
 * ```json
 * {
 *   "assets/Counter.e8357007.js": "assets/Counter.e8357007.8f31e4baa4.js",
 *   "assets/_...404_.68cf6c56.js": "assets/_...404_.68cf6c56.baba7f4d98.js",
 *   "assets/about.f03466fc.js": "assets/about.f03466fc.390e8a8920.js",
 *   "assets/entry-client.a6d191bb.js": "assets/entry-client.a6d191bb.530bd80ed6.js",
 *   "assets/entry-client.b4a47d5a.css": "assets/entry-client.b4a47d5a.5df049b686.css",
 *   "assets/index.d3e176d7.js": "assets/index.d3e176d7.e02e4320da.js",
 *   "favicon.ico": "favicon.d2db245add.ico",
 *   "manifest.json": "manifest.10eaf89c07.json",
 *   "route-manifest.json": "route-manifest.4ff2febcfe.json",
 *   "ssr-manifest.json": "ssr-manifest.63eaf33625.json"
 * }
 * ```
 */
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.headers.get("Upgrade") === "websocket") {
      const durableObjectId = env.DO_WEBSOCKET.idFromName(url.pathname + url.search);
      const durableObjectStub = env.DO_WEBSOCKET.get(durableObjectId);
      const response = await durableObjectStub.fetch(request);
      return response;
    }

    env.manifest = manifest;
    env.getStaticAsset = async request => {
      const response = await getAssetFromKV(
        {
          request,
          waitUntil(promise) {
            return ctx.waitUntil(promise);
          }
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest
        }
      );

      // This path comes from Vite at `build.assetsDir`
      // or `build.rollupOptions.{entryFileNames,chunkFileNames,assetFileNames}`
      // https://github.com/vitejs/vite/blob/07d3fbd21e6b63a12997d201a2deb5b2f2129882/packages/vite/src/node/build.ts#L552
      const isAsset = pathname.startsWith("/assets/");

      if (isAsset) {
        response.headers.set("cache-control", "public, immutable, max-age=31536000");
      }

      return response;
    };

    env.getStaticHTML = async path => {
      return await env.getStaticAsset(new Request(new URL(path + ".html", request.url.toString())));
    };

    try {
      return await env.getStaticAsset(request);
    } catch (e) {
      if (!(e instanceof NotFoundError || e instanceof MethodNotAllowedError)) {
        return new Response("An unexpected error occurred", { status: 500 });
      }
    }
    return handler({
      request: request,
      env
    });
  }
};
