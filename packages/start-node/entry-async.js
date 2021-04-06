import { readFileSync } from "fs";
import { createServer } from "solid-adapter-node/server.js";
import preload from "solid-start/runtime/preload.js";
import manifest from "../dist/rmanifest.json";
import { render } from "./app";

const template = readFileSync("index.html", "utf-8");

createServer({
  render(req, res) {
    const ctx = {}
    const { html, script } = await render(req.url, ctx);

    const appHtml = template.replace(`<!--app-head-->`, script + preload(ctx.router[0].current, manifest)).replace(`<!--app-html-->`, html);

    res.status(200).set({ "Content-Type": "text/html" }).end(appHtml);
  }
});
