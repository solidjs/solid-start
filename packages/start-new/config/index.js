import { serverFunctions } from "@vinxi/plugin-server-functions";
import defu from "defu";
import { join } from "node:path";
import { createApp, resolve } from "vinxi";
import { config } from "vinxi/plugins/config";
import solid from "vite-plugin-solid";
import { SolidStartClientFileRouter, SolidStartServerFileRouter } from "./fs-router";
import { serverComponents } from "./server-components";
const DEFAULT_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

function solidStartClientFsRouter(config) {
  return (router, app) =>
    new SolidStartClientFileRouter(
      {
        dir: resolve.absolute(config.dir, router.root),
        extensions: config.extensions ?? ["js", "jsx", "ts", "tsx"]
      },
      router,
      app
    );
}

function solidStartServerFsRouter(config) {
  return (router, app) =>
    new SolidStartServerFileRouter(
      {
        dir: resolve.absolute(config.dir, router.root),
        extensions: config.extensions ?? ["js", "jsx", "ts", "tsx"]
      },
      router,
      app
    );
}

export function defineConfig(baseConfig = {}) {
  let { plugins = [], start = {}, ...userConfig } = baseConfig;
  const extensions = [...DEFAULT_EXTENSIONS, ...(start.extensions || [])];
  start = defu(start, {
    ssr: true,
    islands: false,
    serverPlugins: []
  });
  return createApp({
    server: {
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
        middleware: start.middleware,
        ...(start.ssr
          ? { routes: solidStartServerFsRouter({ dir: "./src/routes", extensions }) }
          : {}),
        extensions,
        target: "server",
        plugins: () => [
          config("user", userConfig),
          ...plugins,
          start.islands ? serverComponents.server() : null,
          solid({ ssr: true, extensions: extensions.map(ext => `.${ext}`) }),
          config("app-server", {
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
      },
      {
        name: "client",
        mode: "build",
        handler: "./src/entry-client.tsx",
        ...(start.islands
          ? {}
          : {
              routes: solidStartClientFsRouter({ dir: "./src/routes", extensions })
            }),
        extensions,
        target: "browser",
        plugins: () => [
          config("user", userConfig),
          ...plugins,
          serverFunctions.client(),
          start.islands ? serverComponents.client() : null,
          solid({ ssr: start.ssr, extensions: extensions.map(ext => `.${ext}`) }),
          config("app-client", {
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
        ],
        base: "/_build"
      },
      serverFunctions.router({
        plugins: () => [
          config("user", userConfig),
          ...plugins,
          solid({ ssr: true, extensions: extensions.map(ext => `.${ext}`) }),
          config("app-server", {
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
        // middleware: start.middleware
      })
    ]
  });
}
