import { references } from "@vinxi/plugin-references";
import { clientComponents } from "@vinxi/plugin-references/client-components";
import { SERVER_REFERENCES_MANIFEST, hash } from "@vinxi/plugin-references/constants";
import { buildServerComponents } from "@vinxi/plugin-references/server-components";
import {
  decorateExportsPlugin,
  shimExportsPlugin,
  transformReferences,
  wrapExportsPlugin
} from "@vinxi/plugin-references/transform-references";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "vinxi";
import { BaseFileSystemRouter, analyzeModule, cleanPath } from "vinxi/file-system-router";
import { config } from "vinxi/lib/plugins/config";
import solid from "vite-plugin-solid";

class SolidStartFileSystemRouter extends BaseFileSystemRouter {
  toPath(src) {
    const routePath = cleanPath(src, this.config)
      // remove the initial slash
      .slice(1)
      .replace(/index$/, "")
      .replace(/\[([^\/]+)\]/g, (_, m) => {
        if (m.length > 3 && m.startsWith("...")) {
          return `*${m.slice(3)}`;
        }
        if (m.length > 2 && m.startsWith("[") && m.endsWith("]")) {
          return `:${m.slice(1, -1)}?`;
        }
        return `:${m}`;
      });

    return routePath?.length > 0 ? `/${routePath}` : "/";
  }

  toRoute(src) {
    let path = this.toPath(src);

    const [_, exports] = analyzeModule(src);
    const hasRouteData = exports.find(e => e.n === "routeData");
    return {
      $component: {
        src: src,
        pick: ["default", "$css"]
      },
      $$data: hasRouteData
        ? {
            src: src,
            pick: ["routeData"]
          }
        : undefined,
      path,
      filePath: src
    };
  }
}

function server() {
  const runtime = fileURLToPath(new URL("./server-runtime.jsx", import.meta.url));
  // export function serverComponents({
  // 	resolve = {
  // 		conditions: ["react-server"],
  // 	},
  // 	runtime = "@vinxi/react-server-dom-vite/runtime",
  // 	transpileDeps = ["react", "react-dom", "@vinxi/react-server-dom-vite"],
  // 	manifest = SERVER_REFERENCES_MANIFEST,
  // 	transforms = undefined,
  // } = {}) {
  const serverModules = new Set();
  const clientModules = new Set();

  function onReference(type, reference) {
    if (type === "server") {
      serverModules.add(reference);
    } else {
      clientModules.add(reference);
    }
  }

  return [
    transformReferences({
      hash: e => `c_${hash(e)}`,
      runtime,
      onReference: onReference,
      transforms: [
        shimExportsPlugin({
          runtime: {
            module: runtime,
            function: "createServerReference"
          },
          onModuleFound: mod => onReference("server", mod),
          hash: e => `c_${hash(e)}`,
          apply: (code, id, options) => {
            return !options.ssr;
          },
          pragma: "use server"
        }),
        decorateExportsPlugin({
          runtime: {
            module: runtime,
            function: "createServerReference"
          },
          onModuleFound: mod => onReference("server", mod),
          hash: e => `c_${hash(e)}`,
          apply: (code, id, options) => {
            return options.ssr;
          },
          pragma: "use server"
        }),
        wrapExportsPlugin({
          runtime: {
            module: runtime,
            function: "createClientReference"
          },
          onModuleFound: mod => onReference("client", mod),
          hash: e => `c_${hash(e)}`,
          apply: (code, id, options) => {
            return options.ssr;
          },
          pragma: "use client"
        })
      ]
    }),
    buildServerComponents({
      resolve: {
        conditions: []
      },
      transpileDeps: [],
      manifest: SERVER_REFERENCES_MANIFEST,
      modules: {
        server: serverModules,
        client: clientModules
      }
    })
  ];
  // }
}

export function defineConfig(baseConfig = {}) {
  const {
    plugins = [],
    start = {
      islands: false
    },
    ...userConfig
  } = baseConfig;
  return createApp({
    server: {
      plugins: [references.serverPlugin],
      virtual: {
        [references.serverPlugin]: references.serverPluginModule()
      },
      compressPublicAssets: {
        brotli: true
      }
    },

    routers: [
      {
        name: "public",
        mode: "static",
        dir: "./public",
        base: "/"
      },
      {
        name: "ssr",
        mode: "handler",
        handler: "./src/entry-server.tsx",
        dir: "./src/routes",
        style: SolidStartFileSystemRouter,
        build: {
          target: "node",
          plugins: () => [
            // inspect(),
            config("user", userConfig),
            ...plugins,
            start.islands ? server() : null,
            solid({ ssr: true }),
            config("app", {
              resolve: {
                alias: {
                  "#start/app": join(process.cwd(), "src", "app.tsx"),
                  "~": join(process.cwd(), "src")
                }
              },
              define: {
                "import.meta.env.START_ISLANDS": JSON.stringify(start.islands),
                "import.meta.env.SSR": JSON.stringify(true)
              }
            })
          ]
        }
      },
      {
        name: "client",
        mode: "build",
        handler: "./src/entry-client.tsx",
        ...(start.islands
          ? {}
          : {
              style: SolidStartFileSystemRouter,
              dir: "./src/routes"
            }),
        build: {
          target: "browser",
          plugins: () => [
            config("user", userConfig),
            ...plugins,
            references.clientRouterPlugin(),
            start.islands
              ? clientComponents({
                  server: "ssr",
                  transpileDeps: [],
                  manifest: SERVER_REFERENCES_MANIFEST
                })
              : null,

            solid({
              ssr: true
            }),
            config("app", {
              resolve: {
                alias: {
                  "#start/app": join(process.cwd(), "src", "app.tsx"),
                  "~": join(process.cwd(), "src"),
                  ...(start.islands
                    ? {
                        "@solidjs/start/client": "@solidjs/start/client/islands"
                      }
                    : {})
                }
              },
              define: {
                "import.meta.env.START_ISLANDS": JSON.stringify(start.islands),
                "import.meta.env.SSR": JSON.stringify(false)
              }
            })
          ]
        },
        base: "/_build"
      },

      references.serverRouter()
    ]
  });
}
