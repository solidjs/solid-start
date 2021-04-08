import { readFileSync } from "fs";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from "solid-start-node/server.js";
import preload from "solid-start/runtime/preload.js";
import manifest from "../../dist/rmanifest.json";
import { render } from "./app";

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dirname, "index.html"), "utf-8");

const { PORT = 3000 } = process.env;

const server = createServer({
  async render(req, res) {
    if (req.url === "/favicon.ico") return;
    const ctx = {};
    const { html, script } = await render(req.url, ctx);

    const appHtml = template
      .replace(`<!--app-head-->`, script + preload(ctx.router[0].current, manifest))
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
