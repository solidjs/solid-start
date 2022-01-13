import { defineConfig, ViteDevServer } from "vite";
import solid from "solid-start";
import inspect from "vite-plugin-inspect";

let server: ViteDevServer;
export default defineConfig({
  plugins: [
    {
      name: "apiless",
      configureServer: serve => {
        server = serve;
      }
      // configureServer: async server => {
      //   const { createHTTPHandler } = await import(
      //     "@trpc/server/adapters/standalone/dist/trpc-server-adapters-standalone.cjs.js"
      //   );

      //   server.middlewares.use("/__api", async (req, res, next) => {
      //     const { actions } = await server.ssrLoadModule(resolve("./rpcServer.ts"));
      //     console.log(req.url);
      //     let query = new URL(req.url, "http://localhost:3000").pathname;
      //     let handler = createHTTPHandler({
      //       router: router.router().query(query.slice(1), {
      //         resolve: actions[query]
      //       })
      //     });
      //     // const url = new URL(req.url, "http://localhost:3000");
      //     // console.log(path.resolve("./" + req.url + ".api"));

      //     // await router.resolveHTTPResponse({
      //     //   path: req.url,
      //     //   req: { ...req, query: url.searchParams }
      //     // });
      //     // res.end("Hello from apiless");
      //     return handler(req, res);
      //   });
      // }
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
    // {
    //   name: "solid-data",
    //   transform: (code, id) => {
    //     if (id.endsWith("pages/index.tsx")) {
    //       const apiModules = getApiModules(
    //         server.moduleGraph.getModuleById(
    //           "/Users/nikhilsaraf/garage/vinxi/solid-start/examples/with-apiless/src/pages/index.tsx"
    //         )
    //       );
    //       console.log(id, "transform", apiModules);
    //       // return undefined;
    //     }
    //   },
    //   load: id => {
    //     // server.pluginContainer.
    //     if (id.endsWith(".api.ts")) {
    //       console.log(
    //         "load",
    //         id,
    //         getApiModules(
    //           server.moduleGraph.getModuleById(
    //             "/Users/nikhilsaraf/garage/vinxi/solid-start/examples/with-apiless/src/pages/index.tsx"
    //           )
    //         )
    //       );
    //     }
    //   },
    //   enforce: "post"
    // }
  ]
});

// function getApiModules(mod, apiModules = {}) {
//   for (var m of mod.importedModules.values()) {
//     getApiModules(m, apiModules);
//     if (m.id.endsWith(".api.ts")) {
//       apiModules[m.id] = m.url;
//     }
//   }

//   return apiModules;
// }
