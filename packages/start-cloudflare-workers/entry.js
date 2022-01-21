import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import manifest from "../../dist/rmanifest.json";
import assetManifest from "../../dist/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
import entry from "./app";

prepareManifest(manifest, assetManifest);

addEventListener("fetch", event => {
  console.log(`Received new request: ${event.request.url}`);
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  try {
    return await getAssetFromKV(event);
  } catch (err) {
    return entry({ request: event.request, headers: new Headers(), manifest });
  }
}
