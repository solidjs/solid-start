import { references } from "@vinxi/plugin-references";
import { join } from "node:path";
import { createApp } from "vinxi";
import { config } from "vinxi/lib/plugins/config";
import solid from "vite-plugin-solid";
import { SolidStartClientFileRouter, SolidStartServerFileRouter } from "./fs-router";
import { serverComponents } from "./server-components";

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
        style: SolidStartServerFileRouter,
        build: {
          target: "node",
          plugins: () => [
            config("user", userConfig),
            ...plugins,
            start.islands ? serverComponents.server() : null,
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
              style: SolidStartClientFileRouter,
              dir: "./src/routes"
            }),
        build: {
          target: "browser",
          plugins: () => [
            config("user", userConfig),
            ...plugins,
            references.clientRouterPlugin(),
            start.islands ? serverComponents.client() : null,
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
