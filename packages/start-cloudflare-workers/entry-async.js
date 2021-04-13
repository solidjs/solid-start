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
    const { html, script } = await render(url, ctx);

    const appHtml = template
      .replace(`<!--app-head-->`, script + preload(ctx.router[0].current, manifest, assetLookup))
      .replace(`<!--app-html-->`, html);

    return new Response(appHtml, {
      headers: { 'content-type': 'text/html;charset=UTF-8' }
    });
  }
}
