import manifest from "../../dist/rmanifest.json";
import assetManifest from "../../dist/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
import entry from "./app";
import { lookup } from "https://deno.land/x/media_types/mod.ts";

prepareManifest(manifest, assetManifest);

import { serve } from "https://deno.land/std@0.114.0/http/server.ts";

console.log(`Listening on http://localhost:${Deno.env.get("PORT")}`);

serve(
  async request => {
    const { pathname } = new URL(request.url);

    // This is how the server works:
    // 1. A request comes in for a specific asset.
    // 2. We read the asset from the file system.
    // 3. We send the asset back to the client.

    // Check if the request is for style.css.
    if (pathname.startsWith("/assets") || pathname.startsWith("/favicon.ico")) {
      // Read the style.css file from the file system.
      const file = await Deno.readFile(`.${pathname}`);
      // Respond to the request with the style.css file.
      return new Response(file, {
        headers: {
          "content-type": lookup(pathname)
        }
      });
    }

    return entry({
      request: request,
      responseHeaders: new Headers(),
      manifest
    });
  },
  {
    addr: `:${Deno.env.get("PORT")}`
  }
);
