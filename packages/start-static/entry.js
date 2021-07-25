import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import prepareManifest from "solid-start/runtime/prepareManifest.js";
import { render } from "./app.js";
import fetch from "node-fetch";

globalThis.fetch || (globalThis.fetch = fetch);

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "dist", "rmanifest.json"), "utf-8")
);
const assetManifest = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "dist", "manifest.json"), "utf-8")
);
prepareManifest(manifest, assetManifest);

export default req => {
  return render({ url: req.url, manifest });
};
