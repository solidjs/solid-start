import { NextResponse } from 'next/server';
import { render, renderActions } from "./app";
import manifest from "../../dist/public/rmanifest.json";
import assetManifest from "../../dist/public/manifest.json";
import prepareManifest from "solid-start/runtime/prepareManifest";

prepareManifest(manifest, assetManifest);

export function middleware(request) {
  const url = new URL(request.url).pathname;
  if (request.method === "POST") handleAction(request, url);
  else if(!url.includes(".")) {
    const { readable, writable } = new TransformStream();
    render({ url, writable, manifest });
    return new Response(readable, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  } else NextResponse.next();
}

async function handleAction(request, url) {
  const body = await request.json();
  const res = await renderActions(url, body);
  return new Response(res.body, {
    headers: { "content-type": "application/json" },
  })
}
