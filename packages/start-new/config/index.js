import { references } from "@vinxi/plugin-references";
import defu from "defu";
import { join } from "node:path";
import { createApp } from "vinxi";
import { config } from "vinxi/lib/plugins/config";
import solid from "vite-plugin-solid";
import { SolidStartClientFileRouter, SolidStartServerFileRouter } from "./fs-router";
import { serverComponents } from "./server-components";

const DEFAULT_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

export function defineConfig(baseConfig = {}) {
  let { plugins = [], start = {}, serverPlugins = [], ...userConfig } = baseConfig;
	const extensions = [...DEFAULT_EXTENSIONS, ...(start.extensions || [])];
  start = defu(start, {
    ssr: true,
    islands: false
  });
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
        ...(start.ssr ? { dir: "./src/routes", style: SolidStartServerFileRouter } : {}),
				extensions,
        build: {
          target: "server",
          plugins: () => [
            config("user", userConfig),
            ...plugins,
            start.islands ? serverComponents.server() : null,
            solid({ ssr: true }),
            config("app", {
              resolve: {
                alias: {
                  "#start/app": join(process.cwd(), "src", "app.tsx"),
                  "~": join(process.cwd(), "src"),
                  ...(!start.ssr
                    ? {
                        "@solidjs/start/server": "@solidjs/start/server/spa"
                      }
                    : {})
                }
              },
              define: {
                "import.meta.env.START_ISLANDS": JSON.stringify(start.islands),
                "import.meta.env.SSR": JSON.stringify(true),
                "import.meta.env.START_SSR": JSON.stringify(start.ssr)
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
              style: SolidStartClientFileRouter,
              dir: "./src/routes"
            }),
				extensions,
        build: {
          target: "browser",
          plugins: () => [
            config("user", userConfig),
            ...plugins,
            references.clientRouterPlugin(),
            start.islands ? serverComponents.client() : null,
            solid({
              ssr: start.ssr
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
                    : {}),
                  ...(!start.ssr
                    ? {
                        "@solidjs/start/client": "@solidjs/start/client/spa"
                      }
                    : {})
                }
              },
              define: {
                "import.meta.env.START_ISLANDS": JSON.stringify(start.islands),
                "import.meta.env.SSR": JSON.stringify(false),
                "import.meta.env.START_SSR": JSON.stringify(start.ssr)
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
