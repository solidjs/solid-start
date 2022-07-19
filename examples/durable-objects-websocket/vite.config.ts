import { Miniflare } from "miniflare";
import path from "path";
import solid from "solid-start";
import cloudflareWorkers from "solid-start-cloudflare-workers";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    solid({
      adapter: cloudflareWorkers({
        durableObjects: ["WebSocketDurableObject"]
      })
    }),
    {
      name: "vite-plugin-miniflare",
      configureServer: async server => {
        const mf = new Miniflare({
          
          script: `
          addEventListener("fetch",  (event) => {
            event.waitUntil(Promise.resolve(event.request.url));
            event.respondWith((async () => {
              let res = await serve(event, globalThis);
              return new Response(res.body, {
                status: res.status,
                headers: new Headers(res.headers)
              })
            })());
          });
          addEventListener("scheduled", (event) => {
            event.waitUntil(Promise.resolve(event.scheduledTime));
          });

          module.exports = class WebSocketDurableObject {}
          `,
          globals: {
            serve: async (req, g) => {
              console.log(g.Request, g.fetch, g.Response, g.Stream);
              const entry = (await server.ssrLoadModule(path.resolve("./src/entry-server")))
                .default;
              return await entry({ request: req.request, env: {} });
            }
          },
          durableObjects: {
            WebSocketDurableObject: "WebSocketDurableObject"
          }
        });

        mf.dispatchFetch("http://localhost:8787/");
        // console.log(await res.json()); // { url: "http://localhost:8787/", header: null }

        // const res = await mf.dispatchFetch("http://localhost:8787/", {
        //   headers: { "X-Message": "Hello Miniflare!" }
        // });
        // console.log(await res.text()); // Hello Miniflare!
        // console.log((await res.waitUntil())[0]); // http://localhost:8787/

        // const waitUntil = await mf.dispatchScheduled(1000);
        // console.log(waitUntil[0]); // 1000
      }
    }
  ]
});
