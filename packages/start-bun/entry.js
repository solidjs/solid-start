//@ts-check
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

//@ts-ignore It will be generated when building.
import manifest from "../../dist/public/route-manifest.json";
//@ts-ignore It will be generated when building.
import handler from "./entry-server.js";

const { PORT = 3000 } = process.env;

const __dirname = dirname(fileURLToPath(import.meta.url));
const paths = {
  assets: join(__dirname, "/public")
};

const hasAssets = fs.existsSync(paths.assets);
const assetsWebPath = "/assets/";

const env = { manifest };

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);

    /**
     * @param {string} assetPath
     */
    env.getStaticHTML = async assetPath => {
      let text = Bun.file(join(paths.assets, `${assetPath}.html`));
      return new Response(text, {
        headers: {
          "content-type": "text/html"
        }
      });
    };

    function internalFetch(route, init = {}) {
      if (route.startsWith("http")) {
        return fetch(route, init);
      }

      let url = new URL(route, "http://internal");
      const request = new Request(url.href, init);
      console.log("[internal]", req.method, url.href);
      return handler({
        request: request,
        httpServer: server,
        clientAddress: "0.0.0.0", // FIXME
        locals: {},
        env,
        fetch: internalFetch
      });
    }

    if (hasAssets && pathname.startsWith(assetsWebPath)) {
      try {
        const assetFile = Bun.file(join(paths.assets, pathname));
        const blob = await assetFile.arrayBuffer();
        return new Response(blob, {
          headers: {
            "content-type": assetFile.type,
            "cache-control": "public, max-age=31536000, immutable"
          }
        });
      } catch (e) {
        console.log("[assets] not found: %s", pathname);
      }
    }

    const response = await handler({
      request: req,
      httpServer: server,
      clientAddress: "0.0.0.0", // FIXME
      locals: {},
      env,
      fetch: internalFetch
    });

    return response;
  },
});
