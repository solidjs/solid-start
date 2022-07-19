import { getAssetFromKV, MethodNotAllowedError, NotFoundError } from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import manifest from "../../dist/route-manifest.json";
import handler from "./handler";

const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    try {
      return await getAssetFromKV(
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
    } catch (e) {
      if (!(e instanceof NotFoundError || e instanceof MethodNotAllowedError)) {
        return new Response("An unexpected error occurred", { status: 500 });
      }
    }

    env.manifest = manifest;
    return handler({
      request: request,
      env
    });
  }
};
