import { existsSync } from "node:fs";
import path, { isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { TanStackServerFnPluginEnv } from "@tanstack/server-functions-plugin";
import { defu } from "defu";
import { normalizePath, type PluginOption, type Rollup, type ViteDevServer } from "vite";
import solid, { type Options as SolidOptions } from "vite-plugin-solid";

import { CLIENT_BASE_PATH, DEFAULT_EXTENSIONS, VIRTUAL_MODULES } from "../constants.js";
import { isCssModulesFile } from "../server/collect-styles.js";
import { getSsrDevManifest } from "../server/manifest/dev-ssr-manifest.js";
import { SolidStartClientFileRouter, SolidStartServerFileRouter } from "./fs-router.js";
import { fsRoutes } from "./fs-routes/index.js";
import type { BaseFileSystemRouter } from "./fs-routes/router.js";
import {
  clientDistDir,
  nitroPlugin,
  serverDistDir,
  ssrEntryFile,
  type UserNitroConfig
} from "./nitroPlugin.js";

export type { UserNitroConfig } from "./nitroPlugin.js";

export interface SolidStartOptions {
  solid?: Partial<SolidOptions>;
  ssr?: boolean;
  routeDir?: string;
  extensions?: string[];
  server?: UserNitroConfig;
  middleware?: string;
}

const absolute = (path: string, root: string) =>
  path ? (isAbsolute(path) ? path : join(root, path)) : path;

// this needs to live outside of the TanStackStartVitePlugin since it will be invoked multiple times by vite
let ssrBundle: Rollup.OutputBundle;

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
        const clientInput = [handlers.client];

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
            "import.meta.env.START_SSR": JSON.stringify(start.ssr),
            "import.meta.env.START_CLIENT_ENTRY": `"${normalizePath(handlers.client)}"`
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
    TanStackServerFnPluginEnv({
      // This is the ID that will be available to look up and import
      // our server function manifest and resolve its module
      manifestVirtualImportId: VIRTUAL_MODULES.serverFnManifest,
      client: {
        getRuntimeCode: () =>
          `import { createServerReference } from "${normalize(
            fileURLToPath(new URL("../server/server-runtime.js", import.meta.url))
          )}"`,
        replacer: opts =>
          `createServerReference(${() => { }}, '${opts.functionId}', '${opts.extractedFilename}')`
      },
      server: {
        getRuntimeCode: () =>
          `import { createServerReference } from '${normalize(
            fileURLToPath(new URL("../server/server-fns-runtime.js", import.meta.url))
          )}'`,
        replacer: opts =>
          `createServerReference(${opts.fn}, '${opts.functionId}', '${opts.extractedFilename}')`
      }
    }),
    {
      name: "solid-start:manifest-plugin",
      enforce: "pre",
      async resolveId(id) {
        if (id === VIRTUAL_MODULES.clientViteManifest) return `\0${VIRTUAL_MODULES.clientViteManifest}`;
        if (id === VIRTUAL_MODULES.getClientManifest)
          return new URL("../server/manifest/client-manifest.js", import.meta.url).pathname;
        if (id === VIRTUAL_MODULES.getManifest) {
          return this.environment.config.consumer === "client" ?
            new URL("../server/manifest/client-manifest.js", import.meta.url).pathname :
            new URL("../server/manifest/ssr-manifest.js", import.meta.url).pathname;
        }
        if (id === VIRTUAL_MODULES.middleware) {
          if (start.middleware) return await this.resolve(start.middleware);

          return `\0${VIRTUAL_MODULES.middleware}`;
        }
      },
      async load(id) {
        if (id === `\0${VIRTUAL_MODULES.clientViteManifest}`) {
          let clientViteManifest: Record<string, Record<string, any>>;

          if (this.environment.config.command === "serve") {
            clientViteManifest = {};
          } else {
            const entry = Object.values(globalThis.START_CLIENT_BUNDLE).find(
              v => "isEntry" in v && v.isEntry
            );
            if (!entry) throw new Error("No client entry found");

            clientViteManifest = JSON.parse(
              (globalThis.START_CLIENT_BUNDLE[".vite/manifest.json"] as any).source
            );
          }

          return `export const clientViteManifest = ${JSON.stringify(clientViteManifest)};`;
        }
        else if (id === `\0${VIRTUAL_MODULES.middleware}`) return "export default {};"
        else if (id.startsWith("/@manifest")) {
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
        }
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
