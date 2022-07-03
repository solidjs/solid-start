import manifest from "../../.vercel/output/static/rmanifest.json";
import assetManifest from "../../.vercel/output/static/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
import entry from "./entry-server";

prepareManifest(manifest, assetManifest);

export default function (request) {
  const response = entry({
    request,
    env: { manifest }
  });
  return response;
}
