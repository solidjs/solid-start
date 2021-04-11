import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import preload from "solid-start/runtime/preload.js";
import { render } from "./app.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dirname, "..", "..", "dist", "index.html"), "utf-8");
const manifest = JSON.parse(readFileSync(join(__dirname, "..", "..", "dist", "rmanifest.json"), "utf-8"));

export default async req => {
  const ctx = {};
  const { html, script } = await render(req.url, ctx);

  return template
    .replace(`<!--app-head-->`, script + preload(ctx.router[0].current, manifest))
    .replace(`<!--app-html-->`, html);
};
