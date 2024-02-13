import { serverFunctions } from "@vinxi/server-functions/plugin";
import { serverTransform } from "@vinxi/server-functions/server";
import defu from "defu";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp, resolve, type AppOptions } from "vinxi";
import { normalize } from "vinxi/lib/path";
import { config } from "vinxi/plugins/config";
import type { InlineConfig } from "vite";
import type { Options } from "vite-plugin-solid";
import solid from "vite-plugin-solid";
import {
  SolidStartClientFileRouter,
  SolidStartServerFileRouter
} from "./fs-router";
import { serverComponents } from "./server-components.js";

const DEFAULT_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

export type SolidStartInlineConfig = Omit<InlineConfig, "router"> & {
  start?: {
    /**
     * true: streaming mode
     * false: csr only
     * async: ssr is in async mode
     * sync: ssr is in sync mode
     */
    ssr?: boolean | "async" | "sync",
    solid?: Options,
    extensions?: string[],
    server?: AppOptions['server'],
    appRoot?: string,
    middleware?: string,
    islands?: boolean
  }
}

function solidStartClientFsRouter(config: { dir: string, extensions: string[] }) {
  return (router: { root: string; }, app: AppOptions) =>
    new SolidStartClientFileRouter(
      {
        dir: resolve.absolute(config.dir, router.root),
        extensions: config.extensions ?? DEFAULT_EXTENSIONS
      },
      router,
      app
    );
}

function solidStartServerFsRouter(config: { dir: string, extensions: string[] }) {
  return (router: { root: string; }, app: AppOptions) =>
    new SolidStartServerFileRouter(
      {
        dir: resolve.absolute(config.dir, router.root),
        extensions: config.extensions ?? DEFAULT_EXTENSIONS
      },
      router,
      app
    );
}

export function defineConfig(baseConfig: SolidStartInlineConfig = {}) {
  let { plugins = [], start = {}, ...userConfig } = baseConfig;
  const extensions = [...DEFAULT_EXTENSIONS, ...(start.extensions || [])];
  start = defu(start, {
    appRoot: "./src",
    ssr: true,
    islands: false,
    solid: {},
    server: {
      experimental: {
        asyncContext: true
      }
    }
  });
  let server = start.server;
  if (!start.ssr) {
    server = { ...server, prerender: { routes: ["/"] } };
  }
  let entryExtension = ".tsx";
  if (existsSync(join(process.cwd(), start.appRoot, "app.jsx"))) {
    entryExtension = ".jsx";
  }

  return createApp({
    server: {
      compressPublicAssets: {
        brotli: process.versions.bun ? false : true
      },
      ...server
    },
    routers: [
      {
        name: "public",
        type: "static",
        dir: "./public",
        base: "/"
      },
      {
        name: "ssr",
        type: "http",
        link: {
          client: start.islands ? undefined : "client"
        },
        handler: `${start.appRoot}/entry-server${entryExtension}`,
        middleware: start.middleware,
        routes: solidStartServerFsRouter({ dir: `${start.appRoot}/routes`, extensions }),
        extensions,
        target: "server",
        plugins: async () => [
          config("user", {
            ...userConfig,
            optimizeDeps: {
              ...(userConfig.optimizeDeps || {}),
              include: [
                ...(userConfig.optimizeDeps?.include || []),
                "@solidjs/start > source-map-js",
                "@solidjs/start > error-stack-parser"
              ]
            }
          }),
          ...(typeof plugins === "function" ? [...(await plugins())] : plugins),

          serverTransform({
            runtime: normalize(fileURLToPath(new URL("./server-fns-runtime.ts", import.meta.url)))
          }),
          start.islands ? serverComponents.server() : null,
          solid({ ...start.solid, ssr: true, extensions: extensions.map(ext => `.${ext}`) }),
          config("app-server", {
            resolve: {
              alias: {
                "#start/app": join(process.cwd(), start.appRoot, `app${entryExtension}`),
                "~": join(process.cwd(), start.appRoot),
                ...(!start.ssr
                  ? {
                    "@solidjs/start/server": "@solidjs/start/server/spa"
                  }
                  : {}),
                ...userConfig.resolve?.alias
              }
            },
            define: {
              "import.meta.env.START_ISLANDS": JSON.stringify(start.islands),
              "import.meta.env.SSR": JSON.stringify(true),
              "import.meta.env.START_SSR": JSON.stringify(start.ssr),
              ...userConfig.define
            }
          })
        ]
      },
      {
        name: "client",
        type: "client",
        handler: `${start.appRoot}/entry-client${entryExtension}`,
        ...(start.islands
          ? {}
          : {
            routes: solidStartClientFsRouter({ dir: `${start.appRoot}/routes`, extensions })
          }),
        extensions,
        target: "browser",
        plugins: async () => [
          config("user", {
            ...userConfig,
            optimizeDeps: {
              ...(userConfig.optimizeDeps || {}),
              include: [
                ...(userConfig.optimizeDeps?.include || []),
                "@solidjs/start > source-map-js",
                "@solidjs/start > error-stack-parser"
              ]
            }
          }),
          ...(typeof plugins === "function" ? [...(await plugins())] : plugins),
          serverFunctions.client({
            runtime: normalize(fileURLToPath(new URL("./server-runtime.ts", import.meta.url)))
          }),
          start.islands ? serverComponents.client() : null,
          solid({ ...start.solid, ssr: start.ssr, extensions: extensions.map(ext => `.${ext}`) }),
          config("app-client", {
            resolve: {
              alias: {
                "#start/app": join(process.cwd(), start.appRoot, `app${entryExtension}`),
                "~": join(process.cwd(), start.appRoot),
                ...(start.islands
                  ? {
                    "@solidjs/start/client": "@solidjs/start/client/islands"
                  }
                  : {}),
                ...(!start.ssr
                  ? {
                    "@solidjs/start/client": "@solidjs/start/client/spa"
                  }
                  : {}),
                ...userConfig.resolve?.alias
              }
            },
            define: {
              "import.meta.env.START_ISLANDS": JSON.stringify(start.islands),
              "import.meta.env.SSR": JSON.stringify(false),
              "import.meta.env.START_SSR": JSON.stringify(start.ssr),
              "import.meta.env.SERVER_BASE_URL": JSON.stringify(server?.baseURL ?? ""),
              ...userConfig.define
            }
          })
        ],
        base: "/_build"
      },
      serverFunctions.router({
        handler: normalize(fileURLToPath(new URL("./server-handler.ts", import.meta.url))),
        runtime: normalize(fileURLToPath(new URL("./server-fns-runtime.ts", import.meta.url))),
        routes: solidStartServerFsRouter({ dir: `${start.appRoot}/routes`, extensions }),
        plugins: async () => [
          config("user", {
            ...userConfig,
            optimizeDeps: {
              ...(userConfig.optimizeDeps || {}),
              include: [
                ...(userConfig.optimizeDeps?.include || []),
                "@solidjs/start > source-map-js",
                "@solidjs/start > error-stack-parser"
              ]
            }
          }),
          ...(typeof plugins === "function" ? [...(await plugins())] : plugins),

          solid({ ...start.solid, ssr: true, extensions: extensions.map(ext => `.${ext}`) }),
          config("app-server", {
            resolve: {
              alias: {
                "#start/app": join(process.cwd(), start.appRoot, `app${entryExtension}`),
                "~": join(process.cwd(), start.appRoot),
                ...(!start.ssr
                  ? {
                    "@solidjs/start/server": "@solidjs/start/server/spa"
                  }
                  : {}),
                ...userConfig.resolve?.alias
              }
            },
            define: {
              "import.meta.env.START_ISLANDS": JSON.stringify(start.islands),
              "import.meta.env.SSR": JSON.stringify(true),
              "import.meta.env.START_SSR": JSON.stringify(start.ssr),
              ...userConfig.define
            }
          })
        ],
        middleware: start.middleware
      })
    ]
  });
}
