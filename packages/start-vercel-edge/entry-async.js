import { render, renderActions } from "./app";
import manifest from "../../dist/public/rmanifest.json";
import assetManifest from "../../dist/public/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";

prepareManifest(manifest, assetManifest);

export async function middleware(request) {
  const url = new URL(request.url).pathname;
  if (request.method === "POST") handleAction(request, url);
  else if(!url.includes(".")) {
    const html = await render({ url, manifest });
    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  } else NextResponse.next();
}

async function handleAction(request) {
  const body = await request.json();
  const res = await renderActions(url, body);
  return new Response(res.body, {
    headers: { "content-type": "application/json" },
  })
}
