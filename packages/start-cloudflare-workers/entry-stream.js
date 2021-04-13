import { render } from "./app";
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import preload from "solid-start/runtime/preload";
import processSSRManifest from "solid-start/runtime/processSSRManifest";
import manifest from "../../dist/rmanifest.json";
import ssrManifest from "../../dist/ssr-manifest.json";
import template from "../../dist/index.html"

const assetLookup = processSSRManifest(ssrManifest);

addEventListener('fetch', event => {
  console.log(`Received new request: ${event.request.url}`);
  event.respondWith(handleEvent(event));
});

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleEvent(event) {
  const url = new URL(event.request.url).pathname
  try {
    if (url==="/") throw new Error("index")
    return await getAssetFromKV(event);
  } catch (err) {
    const ctx = {};
    const { writeTo, script } = render(url, ctx);

    const [htmlStart, htmlEnd] = template
      .replace(`<!--app-head-->`, script + preload(ctx.router[0].current, manifest, assetLookup) || "")
      .split(`<!--app-html-->`);

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    writer.write(encoder.encode(htmlStart))
    writeTo(writer)
      .then(() => {
        writer.write(encoder.encode(htmlEnd));
        writer.close();
      }).catch(err=> console.log(err.message));
    return new Response(readable, {
      headers: { 'content-type': 'text/html;charset=UTF-8' }
    });
  }
}
