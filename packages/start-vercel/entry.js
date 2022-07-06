import prepareManifest from "solid-start/runtime/prepareManifest";
import assetManifest from "../../.vercel/output/static/manifest.json";
import manifest from "../../.vercel/output/static/rmanifest.json";
import entry from "./entry-server";

prepareManifest(manifest, assetManifest);

export default function (request) {
  const response = entry({
    request,
    env: { manifest }
  });
  return response;
}
