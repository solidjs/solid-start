import { render } from "./app";
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import preload from "solid-start/runtime/preload";
import manifest from "../../dist/rmanifest.json";

addEventListener('fetch', event => {
  console.log(`Received new request: ${event.request.url}`);
  event.respondWith(handleEvent(event));
});

let template;
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
    if (!template) {
      template = await __STATIC_CONTENT.list({prefix: "index"})
        .then(res => __STATIC_CONTENT.get(res.keys[0].name));
    }
    const ctx = {};
    const { html, script } = await render(url, ctx);

    const appHtml = template
      .replace(`<!--app-head-->`, script + preload(ctx.router[0].current, manifest))
      .replace(`<!--app-html-->`, html);

    return new Response(appHtml, {
      headers: { 'content-type': 'text/html;charset=UTF-8' }
    });
  }
}
