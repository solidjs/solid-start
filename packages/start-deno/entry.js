import manifest from "../../dist/public/rmanifest.json";
import assetManifest from "../../dist/public/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
import entry from "./app";
import { lookup } from "https://deno.land/x/media_types/mod.ts";

prepareManifest(manifest, assetManifest);

import { serve } from "https://deno.land/std@0.139.0/http/server.ts";

serve(
  async request => {
    const { pathname } = new URL(request.url);
    console.log(pathname);

    // This is how the server works:
    // 1. A request comes in for a specific asset.
    // 2. We read the asset from the file system.
    // 3. We send the asset back to the client.

    try {
      const file = await Deno.readFile(`./public${pathname}`);
      // Respond to the request with the style.css file.
      return new Response(file, {
        headers: {
          "content-type": lookup(pathname)
        }
      });
    } catch (e) {}

    return await entry({
      request: request,
      env: { manifest }
    });
  },
  {
    port: Number(Deno.env.get("PORT") ?? "8080")
  }
);
