import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import preload from "solid-start/runtime/preload.js";
import processSSRManifest from "solid-start/runtime/processSSRManifest.js";
import { render } from "./app.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dirname, "..", "..", "dist", "index.html"), "utf-8");
const manifest = JSON.parse(readFileSync(join(__dirname, "..", "..", "dist", "rmanifest.json"), "utf-8"));
const ssrManifest = JSON.parse(readFileSync(join(__dirname, "..", "..", "dist", "ssr-manifest.json"), "utf-8"));
const assetLookup = processSSRManifest(ssrManifest);

export default async req => {
  const ctx = {};
  const { html, script } = await render(req.url, ctx);

  return template
    .replace(`<!--app-head-->`, script + preload(ctx.router[0].current, manifest, assetLookup))
    .replace(`<!--app-html-->`, html);
};
