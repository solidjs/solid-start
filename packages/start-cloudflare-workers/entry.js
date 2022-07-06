import { getAssetFromKV, MethodNotAllowedError, NotFoundError } from "@cloudflare/kv-asset-handler";
import prepareManifest from "solid-start/runtime/prepareManifest";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import internalAssetManifest from "../../dist/manifest.json";
import manifest from "../../dist/rmanifest.json";
import entry from "./app";

prepareManifest(manifest, internalAssetManifest);

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
    return entry({
      request: request,
      env
    });
  }
};
