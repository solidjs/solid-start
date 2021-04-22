import { render, renderActions } from "./app";
import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
import preload from "solid-start/runtime/preload";
import serverScripts from "solid-start/runtime/serverScripts";
import processSSRManifest from "solid-start/runtime/processSSRManifest";
import manifest from "../../dist/rmanifest.json";
import ssrManifest from "../../dist/ssr-manifest.json";
import template from "../../dist/index.html";

const assetLookup = processSSRManifest(ssrManifest);

addEventListener("fetch", event => {
  console.log(`Received new request: ${event.request.url}`);
  if (request.method === "POST") {
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
    if (url === "/") throw new Error("index");
    return await getAssetFromKV(event);
  } catch (err) {
    const { add, get } = serverScripts();
    const ctx = { add };
    const { writeTo, script } = render(url, ctx);

    const [htmlStart, htmlEnd] = template
      .replace(
        `<!--app-head-->`,
        script + preload(ctx.router[0].current, manifest, assetLookup) + get()
      )
      .split(`<!--app-html-->`);

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    writer.write(encoder.encode(htmlStart));
    writeTo(writer)
      .then(() => {
        writer.write(encoder.encode(htmlEnd));
        writer.close();
      })
      .catch(err => console.log(err.message));
    return new Response(readable, {
      headers: { "content-type": "text/html;charset=UTF-8" }
    });
  }
}
