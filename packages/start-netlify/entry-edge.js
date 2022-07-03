import manifest from "../../netlify/rmanifest.json";
import assetManifest from "../../netlify/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
import entry from "./app";

prepareManifest(manifest, assetManifest);

export default request =>
  entry({
    request,
    env: { manifest }
  });
