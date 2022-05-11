import manifest from "../../dist/rmanifest.json";
import assetManifest from "../../dist/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
import entry from "./app";

prepareManifest(manifest, assetManifest);

export const onRequestGet = ({ request, next }) => {
  // Handle static assets
  if (/\.\w+$/.test(request.url)) {
    return next(request);
  }

  return entry({
    request,
    responseHeaders: new Headers(),
    manifest,
  });
};

export async function onRequestPost({ request }) {
  // Allow for POST /_m/33fbce88a9 server function
  return entry({
    request,
    responseHeaders: new Headers(),
    manifest,
  });
}
