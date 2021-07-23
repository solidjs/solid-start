import { render, renderActions } from "./app";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import manifest from "../../dist/rmanifest.json";
import assetManifest from "../../dist/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";

prepareManifest(manifest, assetManifest);

addEventListener("fetch", event => {
  console.log(`Received new request: ${event.request.url}`);
  if (event.request.method === "POST") {
    return event.respondWith(handleRequest(event.request))
  } else event.respondWith(handleEvent(event));
});

async function handleRequest(request) {
  const url = new URL(request.url).pathname;
  const body = await request.json();
  const res = await renderActions(url, body);
  return new Response(res.body, {
    headers: { "content-type": "application/json" },
  })
}

async function handleEvent(event) {
  const url = new URL(event.request.url).pathname;
  try {
    return await getAssetFromKV(event);
  } catch (err) {
    const html = await render({ url, manifest });
    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
}
