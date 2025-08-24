import { createTanStackServerFnPlugin } from "@tanstack/server-functions-plugin";
import { defu } from "defu";
import { existsSync } from "node:fs";
import path, { isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import type { StartServerManifest } from "solid-start:server-manifest";
import { normalizePath, type PluginOption, type Rollup, type ViteDevServer } from "vite";
import solid, { type Options as SolidOptions } from "vite-plugin-solid";

import { isCssModulesFile } from "../server/collect-styles.js";
import { getSsrDevManifest } from "../server/manifest/dev-server-manifest.js";
import { SolidStartClientFileRouter, SolidStartServerFileRouter } from "./fs-router.js";
import { fsRoutes } from "./fs-routes/index.js";
import {
  clientDistDir,
  nitroPlugin,
  serverDistDir,
  ssrEntryFile,
  type UserNitroConfig
} from "./nitroPlugin.js";
import { BaseFileSystemRouter } from "./fs-routes/router.js";

const DEFAULT_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

export type { UserNitroConfig } from "./nitroPlugin.js";

export interface SolidStartOptions {
  solid?: Partial<SolidOptions>;
  ssr?: boolean;
  routeDir?: string;
  extensions?: string[];
  server?: UserNitroConfig;
  middleware?: string;
}

const SolidStartServerFnsPlugin = createTanStackServerFnPlugin({
  // This is the ID that will be available to look up and import
  // our server function manifest and resolve its module
  manifestVirtualImportId: "solidstart:server-fn-manifest",
  client: {
    getRuntimeCode: () =>
      `import { createServerReference } from "${normalize(
        fileURLToPath(new URL("../server/server-runtime.js", import.meta.url))
      )}"`,
    replacer: opts =>
      `createServerReference(${() => { }}, '${opts.functionId}', '${opts.extractedFilename}')`
  },
  ssr: {
    getRuntimeCode: () =>
      `import { createServerReference } from '${normalize(
        fileURLToPath(new URL("../server/server-fns-runtime.js", import.meta.url))
      )}'`,
    replacer: opts =>
      `createServerReference(${opts.fn}, '${opts.functionId}', '${opts.extractedFilename}')`
  },
  server: {
    getRuntimeCode: () =>
      `import { createServerReference } from '${normalize(
        fileURLToPath(new URL("../server/server-fns-runtime.js", import.meta.url))
      )}'`,
    replacer: opts =>
      `createServerReference(${opts.fn}, '${opts.functionId}', '${opts.extractedFilename}')`
  }
});

const absolute = (path: string, root: string) =>
  path ? (isAbsolute(path) ? path : join(root, path)) : path;

// this needs to live outside of the TanStackStartVitePlugin since it will be invoked multiple times by vite
let ssrBundle: Rollup.OutputBundle;

const VIRTUAL_MODULES = {
  serverManifest: "solid-start:server-manifest",
  getClientManifest: "solid-start:get-client-manifest",
  getSsrManifest: "solid-start:get-ssr-manifest",
  getManifest: "solid-start:get-manifest",
  middleware: "solid-start:middleware"
} as const;

export const CLIENT_BASE_PATH = "_build";

function solidStartVitePlugin(options?: SolidStartOptions): Array<PluginOption> {
  const start = defu(options ?? {}, {
    appRoot: "./src",
    routeDir: "./routes",
    ssr: true,
    devOverlay: true,
    experimental: {
      islands: false
    },
    solid: {},
    server: {
      routeRules: {
        "/_build/assets/**": {
          headers: { "cache-control": "public, immutable, max-age=31536000" }
        }
      },
      experimental: {
        asyncContext: true
      }
    },
    extensions: []
  });
  const extensions = [...DEFAULT_EXTENSIONS, ...(start.extensions || [])];

  const routeDir = join(start.appRoot, start.routeDir);

  let entryExtension = ".tsx";
  if (existsSync(join(process.cwd(), start.appRoot, "app.jsx"))) entryExtension = ".jsx";

  const handlers = {
    client: `${start.appRoot}/entry-client${entryExtension}`,
    server: `${start.appRoot}/entry-server${entryExtension}`
  };

  const root = process.cwd();

  return [
    {
      name: "solid-start:vite-config",
      enforce: "pre",
      configEnvironment(name) {
        return {
          define: {
            "import.meta.env.SSR": JSON.stringify(name === "server")
          }
        };
      },
      async config(_, env) {
        let clientInput = [handlers.client];

        if (env.command === "build") {
          const clientRouter: BaseFileSystemRouter = (globalThis as any).ROUTERS.client
          for (const route of await clientRouter.getRoutes()) {
            for (const [key, value] of Object.entries(route)) {
              if (value && key.startsWith("$") && !key.startsWith("$$")) {
                function toRouteId(route: any) {
                  return `${route.src}?${route.pick.map((p: string) => `pick=${p}`).join("&")}`;
                }

                clientInput.push(toRouteId(value));
              }
            }
          }
        }

        return {
          base: env.command === "build" ? `/${CLIENT_BASE_PATH}` : undefined,
          environments: {
            client: {
              consumer: "client",
              build: {
                copyPublicDir: false,
                write: true,
                manifest: true,
                rollupOptions: {
                  input: clientInput,
                  output: {
                    dir: path.resolve(process.cwd(), clientDistDir, CLIENT_BASE_PATH)
                  },
                  external: ["node:fs", "node:path", "node:os", "node:crypto"],
                  treeshake: true,
                  preserveEntrySignatures: "exports-only",
                }
              }
            },
            server: {
              consumer: "server",
              build: {
                ssr: true,
                // we don't write to the file system as the below 'capture-output' plugin will
                // capture the output and write it to the virtual file system
                write: true,
                manifest: true,
                copyPublicDir: false,
                rollupOptions: {
                  output: {
                    dir: path.resolve(process.cwd(), serverDistDir),
                    entryFileNames: ssrEntryFile
                  },
                  plugins: [
                    {
                      name: "capture-output",
                      generateBundle(options, bundle) {
                        // TODO can this hook be called more than once?
                        ssrBundle = bundle;
                      }
                    }
                  ] as Array<PluginOption>
                },
                commonjsOptions: {
                  include: [/node_modules/]
                }
              }
            }
          },
          resolve: {
            alias: {
              "#start/app": join(process.cwd(), start.appRoot, `app${entryExtension}`),
              "~": join(process.cwd(), start.appRoot),
              ...(!start.ssr
                ? {
                  "@solidjs/start/server": "@solidjs/start/server/spa",
                  "@solidjs/start/client": "@solidjs/start/client/spa"
                }
                : {})
            }
          },
          define: {
            "import.meta.env.MANIFEST": `globalThis.MANIFEST`,
            "import.meta.env.START_SSR": JSON.stringify(start.ssr)
          }
        };
      }
    },
    css(),
    fsRoutes({
      routers: {
        client:
          new SolidStartClientFileRouter({
            dir: absolute(routeDir, root),
            extensions
          }),
        server:
          new SolidStartServerFileRouter({
            dir: absolute(routeDir, root),
            extensions,
            dataOnly: !start.ssr
          })
      }
    }),
    // Must be placed after fsRoutes, as treeShake will remove the
    // server fn exports added in by this plugin
    {
      name: "solid-start:server-fns",
      enforce: "pre",
      applyToEnvironment(env) {
        if (env.name === "server") return SolidStartServerFnsPlugin.server;
        return SolidStartServerFnsPlugin.client;
      }
    },
    {
      name: "solid-start:manifest-plugin",
      enforce: "pre",
      async resolveId(id) {
        if (id === VIRTUAL_MODULES.serverManifest) return `\0${VIRTUAL_MODULES.serverManifest}`;
        if (id === VIRTUAL_MODULES.getClientManifest)
          return new URL("../server/manifest/client-manifest.js", import.meta.url).pathname;
        if (id === VIRTUAL_MODULES.getSsrManifest)
          return new URL("../server/manifest/ssr-manifest.js", import.meta.url).pathname;
        if (id === VIRTUAL_MODULES.getManifest)
          return this.environment.config.consumer === "server"
            ? new URL("../server/manifest/ssr-manifest.js", import.meta.url).pathname
            : new URL("../server/manifest/client-manifest.js", import.meta.url).pathname;
        if (id === VIRTUAL_MODULES.middleware) {
          if (start.middleware) return await this.resolve(start.middleware);

          return `\0${VIRTUAL_MODULES.middleware}`;
        }
      },
      async load(id) {
        if (id === `\0${VIRTUAL_MODULES.serverManifest}`) {
          if (this.environment.config.command === "serve") {
            const manifest: StartServerManifest = {
              clientEntryId: normalizePath(handlers.client),
              clientViteManifest: {},
            };

            return `export const manifest = ${JSON.stringify(manifest)}`;
          }

          const entry = Object.values(globalThis.START_CLIENT_BUNDLE).find(
            v => "isEntry" in v && v.isEntry
          );
          if (!entry) throw new Error("No client entry found");

          const clientManifest: Record<string, Record<string, any>> = JSON.parse(
            (globalThis.START_CLIENT_BUNDLE[".vite/manifest.json"] as any).source
          );

          const manifest: StartServerManifest = {
            clientEntryId: normalizePath(handlers.client),
            clientViteManifest: clientManifest as any,
          };

          return `export const manifest = ${JSON.stringify(manifest)};`;
        } else if (id.startsWith("/@manifest")) {
          const [path, query] = id.split("?");
          const params = new URLSearchParams(query);
          if (!path || !query) return;
          if (path.endsWith("assets")) {
            const id = params.get("id");
            if (!id) {
              throw new Error("Missing id to get assets.");
            }
            return `export default ${JSON.stringify(
              await getSsrDevManifest("server").getAssets(id)
            )}`;
          }
        } else if (id === `\0${VIRTUAL_MODULES.middleware}`) return "export default {};"
      }
    },
    nitroPlugin({ root: process.cwd() }, () => ssrBundle, start.server),
    {
      name: "solid-start:capture-client-bundle",
      enforce: "post",
      generateBundle(_options, bundle) {
        globalThis.START_CLIENT_BUNDLE = bundle;
      }
    },
    solid({
      ...start.solid,
      ssr: true,
      extensions: extensions.map(ext => `.${ext}`)
    })
  ];
}

export { solidStartVitePlugin as solidStart };

function css(): PluginOption {
  let viteServer!: ViteDevServer;
  let cssModules: Record<string, any> = {};

  return {
    name: "solid-start:css-hmr",
    configureServer(dev) {
      viteServer = dev;
    },
    async handleHotUpdate({ file, server }) {
      if (file.endsWith(".css")) {
        const resp = await server.transformRequest(file);
        if (!resp) return;
        const json = resp.code
          .match(/const __vite__css = .*\n/)?.[0]
          ?.slice("const __vite__css = ".length);
        if (!json) return;
        resp.code = JSON.parse(json);
        viteServer.ws.send({
          type: "custom",
          event: "css-update",
          data: {
            file,
            contents: resp.code
          }
        });
      }
    },
    transform(code, id) {
      if (isCssModulesFile(id)) {
        cssModules[id] = code;
      }
    }
  };
}
