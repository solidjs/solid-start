/// <reference types="node" />

import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { spawn } from "child_process";
import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { Miniflare } from "miniflare";
import { dirname, join } from "path";
import { rollup } from "rollup";
import { fileURLToPath } from "url";
import { createServer } from "./dev-server.js";

export default function (miniflareOptions = {}) {
  return {
    name: "cloudflare-workers",
    async dev(options, vite, dev) {
      const mf = new Miniflare({
        script: `
        export default {
          fetch: async (request, env) => {
            return await serve(request, env, globalThis);
          }
        }

        export const WebSocketDurableObject = WebSocketDurableObject1;
      `,
        globals: {
          WebSocketDurableObject1: class DO {
            state;
            env;
            promise;
            constructor(state, env) {
              this.state = state;
              this.env = env;
              this.promise = this.createProxy(state, env);
            }

            async createProxy(state, env) {
              const { WebSocketDurableObject } = await vite.ssrLoadModule("~start/entry-server");
              return new WebSocketDurableObject(state, env);
            }

            async fetch(request) {
              console.log("DURABLE_OBJECT", request.url);

              try {
                let dObject = await this.promise;
                return await dObject.fetch(request);
              } catch (e) {
                console.log("error", e);
              }
            }
          },
          serve: async (req, e, g) => {
            const {
              Request,
              Response,
              fetch,
              crypto,
              Headers,
              ReadableStream,
              WritableStream,
              WebSocketPair,
              TransformStream
            } = g;
            Object.assign(globalThis, {
              Request,
              Response,
              fetch,
              crypto,
              Headers,
              ReadableStream,
              WritableStream,
              TransformStream,
              WebSocketPair
            });

            console.log(
              "🔥",
              req.headers.get("Upgrade") === "websocket" ? "WEBSOCKET" : req.method,
              req.url
            );

            if (req.headers.get("Upgrade") === "websocket") {
              const url = new URL(req.url);
              console.log(url.search);
              const durableObjectId = e.DO_WEBSOCKET.idFromName(url.pathname + url.search);
              const durableObjectStub = e.DO_WEBSOCKET.get(durableObjectId);
              const response = await durableObjectStub.fetch(req);
              return response;
            }

            try {
              return await dev.fetch(req, e);
            } catch (e) {
              console.log("error", e);
              return new Response(e.toString(), { status: 500 });
            }
          }
        },
        modules: true,
        kvPersist: true,
        compatibilityFlags: ["streams_enable_constructors"],
        ...miniflareOptions
      });

      console.log("🔥", "starting miniflare");

      return await createServer(vite, mf, {});
    },
    start(config, { port }) {
      process.env.PORT = port;
      const proc = spawn("node", [
        join(config.root, "node_modules", "wrangler", "bin", "wrangler.js"),
        "dev",
        "./dist/server.js",
        "--site",
        "./dist/public",
        "--port",
        process.env.PORT
      ]);
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
      return `http://localhost:${process.env.PORT}`;
    },
    async build(config, builder) {
      const __dirname = dirname(fileURLToPath(import.meta.url));

      if (!config.solidOptions.ssr) {
        await builder.spaClient(join(config.root, "dist", "public"));
        await builder.server(join(config.root, ".solid", "server"));
      } else if (config.solidOptions.islands) {
        await builder.islandsClient(join(config.root, "dist", "public"));
        await builder.server(join(config.root, ".solid", "server"));
      } else {
        await builder.client(join(config.root, "dist", "public"));
        await builder.server(join(config.root, ".solid", "server"));
      }

      copyFileSync(
        join(config.root, ".solid", "server", `entry-server.js`),
        join(config.root, ".solid", "server", "handler.js")
      );
      copyFileSync(join(__dirname, "entry.js"), join(config.root, ".solid", "server", "server.js"));
      let durableObjects = Object.values(miniflareOptions?.durableObjects || {});

      if (durableObjects.length > 0) {
        let text = readFileSync(join(config.root, ".solid", "server", "server.js"), "utf8");
        durableObjects.forEach(item => {
          text += `\nexport { ${item} } from "./handler";`;
        });
        writeFileSync(join(config.root, ".solid", "server", "server.js"), text);
      }
      const bundle = await rollup({
        input: join(config.root, ".solid", "server", "server.js"),
        plugins: [
          json(),
          nodeResolve({
            preferBuiltins: true,
            exportConditions: ["worker", "solid"]
          }),
          common({ strictRequires: true, ...config.build.commonjsOptions })
        ]
      });
      // or write the bundle to disk
      await bundle.write({ format: "esm", dir: join(config.root, "dist") });

      // closes the bundle
      await bundle.close();
    }
  };
}
