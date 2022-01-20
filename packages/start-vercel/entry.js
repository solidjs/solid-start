import manifest from "../../.output/static/rmanifest.json";
import assetManifest from "../../.output/static/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";
import entry from "./app";

prepareManifest(manifest, assetManifest);

const wrapResponse = response => ({
  promise: Promise.resolve(),
  waitUntil: Promise.resolve(),
  response
});

function middleware({ request }) {
  const url = new URL(request.url).pathname;
  if (!url.includes(".")) {
    const response = entry({ request, headers: new Headers(), manifest });
    return wrapResponse(response);
  }
  return wrapResponse(
    new Response(null, {
      headers: {
        "x-middleware-next": "1"
      }
    })
  );
}

_ENTRIES = typeof _ENTRIES === "undefined" ? {} : _ENTRIES;

_ENTRIES["middleware_pages/_middleware"] = { default: middleware };
