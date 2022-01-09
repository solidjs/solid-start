import { defineConfig } from "vite";
import solid from "solid-start";
import path, { resolve } from "path";
import inspect from "vite-plugin-inspect";
import plugin from "./babel-plugin-apiless";
import router from "@trpc/server";

export default defineConfig({
  plugins: [
    {
      name: "apiless",
      configureServer: async server => {
        const { createHTTPHandler } = await import(
          "@trpc/server/adapters/standalone/dist/trpc-server-adapters-standalone.cjs.js"
        );

        server.middlewares.use("/__api", async (req, res, next) => {
          const { actions } = await server.ssrLoadModule(resolve("./rpcServer.ts"));
          console.log(req.url);
          let query = new URL(req.url, "http://localhost:3000").pathname;
          let handler = createHTTPHandler({
            router: router.router().query(query.slice(1), {
              resolve: actions[query]
            })
          });
          // const url = new URL(req.url, "http://localhost:3000");
          // console.log(path.resolve("./" + req.url + ".api"));

          // await router.resolveHTTPResponse({
          //   path: req.url,
          //   req: { ...req, query: url.searchParams }
          // });
          // res.end("Hello from apiless");
          return handler(req, res);
        });
      }
    },
    {
      ...(await import("@mdx-js/rollup")).default({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx"
      }),
      enforce: "pre"
    },
    solid({
      extensions: [".mdx"],
      babel: {
        // plugins: [plugin]
      }
    }),
    inspect()
  ]
});
