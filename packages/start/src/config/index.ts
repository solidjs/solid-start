import { createTanStackServerFnPlugin } from "@tanstack/server-functions-plugin";
import { normalizePath, PluginOption, Rollup } from "vite";
import solid, { Options as SolidOptions } from "vite-plugin-solid";
import { defu } from "defu";
import path, { isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

import { fsRoutes } from "./fs-routes/index.js";
import { SolidStartClientFileRouter, SolidStartServerFileRouter } from "./fs-router.js";
import { clientDistDir, nitroPlugin, serverDistDir, ssrEntryFile } from "./nitroPlugin.js";
import { StartServerManifest } from "solid-start:server-manifest";
import { treeShake } from "./fs-routes/tree-shake.js";

const DEFAULT_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

export interface SolidStartOptions {
  solid?: Partial<SolidOptions>;
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
  clientProdManifest: "solid-start:client-prod-manifest"
} as const;

export const CLIENT_BASE_PATH = "_build";

function solidStartVitePlugin(options: SolidStartOptions): Array<PluginOption> {
  const start = defu(options, {
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

  const routers = {
    handlers,
    routers: {
      client: config =>
        new SolidStartClientFileRouter({
          dir: absolute(routeDir, config.root),
          extensions
        }),
      server: config =>
        new SolidStartServerFileRouter({
          dir: absolute(routeDir, config.root),
          extensions,
          dataOnly: !start.ssr
        })
    }
  };

  return [
    {
      name: "solid-start-vite-config-client",
      enforce: "pre",
      configEnvironment(name) {
        return {
          define: {
            "import.meta.env.SSR": JSON.stringify(name === "server")
          }
        };
      },
      config() {
        return {
          environments: {
            client: {
              consumer: "client",
              build: {
                write: true,
                manifest: true,
                rollupOptions: {
                  input: {
                    client: handlers.client
                  },
                  output: { dir: path.resolve(process.cwd(), clientDistDir, CLIENT_BASE_PATH) },
                  external: ["node:fs", "node:path", "node:os", "node:crypto"]
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
              "~": join(process.cwd(), start.appRoot)
            }
          },
          define: {
            "import.meta.env.MANIFEST": `globalThis.MANIFEST`
          }
        };
      }
    },
    {
      name: "solid-start-server-fns",
      enforce: "pre",
      applyToEnvironment(env) {
        if (env.name === "server") return SolidStartServerFnsPlugin.server;
        return SolidStartServerFnsPlugin.client;
      }
    },
    fsRoutes(routers),
    {
      name: "solid-start:manifest-plugin",
      enforce: "pre",
      resolveId(id) {
        if (id === VIRTUAL_MODULES.serverManifest) return `\0${VIRTUAL_MODULES.serverManifest}`;
        if (id === VIRTUAL_MODULES.clientProdManifest)
          return `\0${VIRTUAL_MODULES.clientProdManifest}`;
      },
      async load(id) {
        if (id === `\0${VIRTUAL_MODULES.serverManifest}`) {
          if (this.environment.config.command === "serve") {
            const manifest: StartServerManifest = {
              clientEntryId: normalizePath(handlers.client),
              clientViteManifest: {},
              routes: {}
            };

            return `export const manifest = ${JSON.stringify(manifest)}`;
          }

          const entry = Object.values(globalThis.START_CLIENT_BUNDLE).find(
            v => "isEntry" in v && v.isEntry
          );
          if (!entry) throw new Error("No client entry found");

          const clientManifest: Record<string, { file: string }> = JSON.parse(
            (globalThis.START_CLIENT_BUNDLE[".vite/manifest.json"] as any).source
          );

          const routes = Object.entries(clientManifest).reduce(
            (acc, [id, entry]) => {
              acc[id] = { output: `/${CLIENT_BASE_PATH}/${entry.file}` };
              return acc;
            },
            {} as Record<string, { output: string }>
          );

          const manifest: StartServerManifest = {
            clientEntryId: normalizePath(handlers.client),
            // clientEntry: `/${CLIENT_BASE_PATH}/${entry.fileName}`,
            clientViteManifest: clientManifest,
            routes
          };

          return `export const manifest = ${JSON.stringify(manifest)};`;
        } else if (id === `\0${VIRTUAL_MODULES.clientProdManifest}`) {
          return `
if(!window.manifest) throw new Error("No client manifest found");
export default window.manifest;
`;
        }
      }
    },
    treeShake(),
    nitroPlugin({ root: process.cwd() }, () => ssrBundle, handlers),
    {
      name: "solid-start:capture-client-bundle",
      enforce: "post",
      generateBundle(_options, bundle) {
        globalThis.START_CLIENT_BUNDLE = bundle;
      }
    },
    solid({ ...start.solid, ssr: true, extensions: extensions.map(ext => `.${ext}`) })
  ];
}

export { solidStartVitePlugin as solidStart };
