import { getAssetFromKV, MethodNotAllowedError, NotFoundError } from "@cloudflare/kv-asset-handler";
import manifestJSON from "__STATIC_CONTENT_MANIFEST";
import manifest from "../../dist/public/route-manifest.json";
import handler from "./handler";

const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request, env, ctx) {
    if (request.headers.get("Upgrade") === "websocket") {
      const url = new URL(request.url);
      const durableObjectId = env.DO_WEBSOCKET.idFromName(url.pathname + url.search);
      const durableObjectStub = env.DO_WEBSOCKET.get(durableObjectId);
      const response = await durableObjectStub.fetch(request);
      return response;
    }

    env.manifest = manifest;
    env.getStaticAsset = async request => {
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
