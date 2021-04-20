import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createServer } from "solid-start-node/server.js";
import preload from "solid-start/runtime/preload.js";
import serverScripts from "solid-start/runtime/serverScripts.js";
import processSSRManifest from "solid-start/runtime/processSSRManifest.js";
import manifest from "../../dist/rmanifest.json";
import ssrManifest from "../../dist/ssr-manifest.json";
import { render } from "./app";

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dirname, "index.html"), "utf-8");
const assetLookup = processSSRManifest(ssrManifest);

const { PORT = 3000 } = process.env;

const server = createServer({
  async render(req, res) {
    if (req.url === "/favicon.ico") return;
    const { add, get } = serverScripts();
    const ctx = { add };
    const { html, script } = await render(req.url, ctx);

    const appHtml = template
      .replace(
        `<!--app-head-->`,
        script + preload(ctx.router[0].current, manifest, assetLookup) + get()
      )
      .replace(`<!--app-html-->`, html);

    res.statusCode = 200;
    res.setHeader("content-type", "text/html");
    res.end(appHtml);
  }
});

server.listen(PORT, err => {
  if (err) {
    console.log("error", err);
  } else {
    console.log(`Listening on port ${PORT}`);
  }
});
