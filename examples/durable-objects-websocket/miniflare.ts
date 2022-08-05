import { Miniflare } from "miniflare";
import { createDevHandler } from "solid-start/dev/server.js";
import { Plugin } from "vite";
import { createServer } from "./src/server";

export function miniflare({
  durableObjects:
}): Plugin {
  let config;
  return {
    name: "solid-start-miniflare",
    async config(c) {
      config = c;
    },
    configResolved(c) {
      // @ts-ignore
      c.solidOptions.devServer = false;
    },
    configureServer: async server => {
      let dev = await createDevHandler(server, config, config.solidOptions);

      const mf = new Miniflare({
        script: `
        export default {
          fetch: async (request, env) => {
            return await serve(request, env, globalThis);
          }
        }

        export const WebSocketDurableObject = WebSocketDurableObject1;
      `,
        kvPersist: true,
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
              const { WebSocketDurableObject } = await server.ssrLoadModule("~start/entry-server");
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
              req.headers.get("Upgrade") === "websocket" ? "WEBSOCKET" : req.method,
              req.url
            );

            if (req.headers.get("Upgrade") === "websocket") {
              const url = new URL(req.url);
              const durableObjectId = e.DO_WEBSOCKET.idFromName(url.pathname);
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
        ...args
      });

      return async () => {
        await createServer(server, mf, {});
      };
    }
  };
}
