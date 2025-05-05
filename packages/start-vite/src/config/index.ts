import { createTanStackServerFnPlugin } from "@tanstack/server-functions-plugin";
import { PluginOption, Rollup } from "vite";
import solid, { Options as SolidOptions } from "vite-plugin-solid";
import { defu } from "defu";
import path, { isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

import { fsRoutes } from "./fs-routes/index.js";
import { SolidStartClientFileRouter, SolidStartServerFileRouter } from "./fs-router.js";
import { clientDistDir, nitroPlugin, ssrEntryFile } from "./nitroPlugin.js";

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
        fileURLToPath(new URL("./server-runtime.ts", import.meta.url))
      )}"`,
    replacer: opts =>
      `createServerReference(${() => {}}, '${opts.functionId}', '${opts.extractedFilename}')`
  },
  ssr: {
    getRuntimeCode: () =>
      `import { createServerReference } from '${normalize(
        fileURLToPath(new URL("./server-fns-runtime.ts", import.meta.url))
      )}'`,
    replacer: opts =>
      `createServerReference(${opts.fn}, '${opts.functionId}', '${opts.extractedFilename}')`
  },
  server: {
    getRuntimeCode: () =>
      `import { createServerReference } from '${normalize(
        fileURLToPath(new URL("./server-fns-runtime.ts", import.meta.url))
      )}'`,
    replacer: opts =>
      `createServerReference(${opts.fn}, '${opts.functionId}', '${opts.extractedFilename}')`
  }
});

const absolute = (path: string, root: string) =>
  path ? (isAbsolute(path) ? path : join(root, path)) : path;

// this needs to live outside of the TanStackStartVitePlugin since it will be invoked multiple times by vite
let ssrBundle: Rollup.OutputBundle;

function solidStartVitePlugin(): Array<PluginOption> {
  const start = defu(
    { extensions: [] },
    {
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
      }
    }
  );
  const extensions = [...DEFAULT_EXTENSIONS, ...(start.extensions || [])];

  const routeDir = join(start.appRoot, start.routeDir);

  let entryExtension = ".tsx";
  if (existsSync(join(process.cwd(), start.appRoot, "app.jsx"))) entryExtension = ".jsx";

  return [
    {
      name: "solid-start-vite-config-client",
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
                    main: "~/entry-client.tsx"
                  },
                  output: { dir: path.resolve(process.cwd(), clientDistDir) },
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
                write: false,
                copyPublicDir: false,
                rollupOptions: {
                  output: {
                    entryFileNames: ssrEntryFile
                  },
                  plugins: [
                    {
                      name: "capture-output",
                      generateBundle(options, bundle) {
                        // TODO can this hook be called more than once?
                        ssrBundle = bundle;
                        console.log(ssrBundle);
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
    fsRoutes({
      handlers: {
        client: `${start.appRoot}/entry-client${entryExtension}`,
        server: `${start.appRoot}/entry-server${entryExtension}`
      },
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
    }),
    solid({ ...start.solid, ssr: true, extensions: extensions.map(ext => `.${ext}`) }),
    nitroPlugin({ root: process.cwd() }, () => {
      return ssrBundle;
    })
  ];
}

export { solidStartVitePlugin as solidStart };
