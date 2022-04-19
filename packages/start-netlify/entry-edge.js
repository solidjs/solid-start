import manifest from "../../netlify/rmanifest.json";
import assetManifest from "../../netlify/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
import entry from "./app";

prepareManifest(manifest, assetManifest);

export default async (request) => {
  const url = new URL(request.url).pathname;
  if (!url.includes(".")) {
    return await entry({
      request,
      responseHeaders: new Headers(),
      manifest
    })
  }
}
