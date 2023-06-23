/// <reference path="./plugin.d.ts" />

import debug from "debug";
import { solidPlugin } from "esbuild-plugin-solid";
import { existsSync } from "fs";
import path, { dirname, join } from "path";
import c from "picocolors";
import { fileURLToPath, pathToFileURL } from "url";
import { loadEnv } from "vite";
// import inspect from "vite-plugin-inspect";
import solid from "vite-plugin-solid";
import printUrls from "../dev/print-routes.js";
import fileRoutesImport from "../fs-router/fileRoutesImport.js";
import { Router, stringifyApiRoutes, stringifyPageRoutes } from "../fs-router/router.js";
import routeData from "../server/routeData.js";
import routeDataHmr from "../server/routeDataHmr.js";
import babelServerModule from "../server/server-functions/babel.js";
import routeResource from "../server/serverResource.js";

/**
 * @typedef {ReturnType<typeof mergeOptions> & { env?: Record<string, string> }} SolidStartOptions
 */

// @ts-ignore
globalThis.DEBUG = debug("start:vite");

let _dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @param {SolidStartOptions} options
 * @param {(source: string, id: string, ssr: boolean) => import('@babel/core').TransformOptions} fn
 * @returns {(source: string, id: string, ssr: boolean) => Promise<import('@babel/core').TransformOptions>}
 */
function mergeBabelOptions(options, fn) {
  return async (...args) => {
    const b =
      typeof options.babel === "function"
        ? await options.babel(...args)
        : options.babel ?? { plugins: [] };
    const d = fn(...args);
    return {
      ...b,
      ...d,
      plugins: [...(b.plugins ?? []), ...(d.plugins ?? [])]
    };
  };
}

/**
 * @returns {import('vite').Plugin}
 */
function solidStartInlineServerModules() {
  return {
    enforce: "pre",
    name: "solid-start-inline-server-modules",
    configureServer(vite) {
      if (!vite.httpServer) return;
      vite.httpServer.once("listening", async () => {
        const label = `  > Server modules: `;
        setTimeout(() => {
          if (vite.resolvedUrls) {
            const url = vite.resolvedUrls.local[0];
            // eslint-disable-next-line no-console
            console.log(`${label}\n   ${c.magenta(`${url}_m/*`)}\n`);
          }
        }, 200);
      });
    }
  };
}

/**
 * @param {SolidStartOptions} options
 * @returns {import('vite').Plugin}
 */
function solidStartFileSystemRouter(options) {
  /** @type {boolean | undefined} */
  let lazy;

  let { delay = 500, glob: enableGlob = true } = options;
  let root = process.cwd();

  /** @type {NodeJS.Timeout | undefined} */
  let timer;
  /**
   * @param {() => void} fn
   */
  function schedule(fn) {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  }

  /** @type {import('vite').ViteDevServer | undefined} */
  let server;

  let router = new Router({
    baseDir: path.posix.join(options.appRoot, options.routesDir),
    pageExtensions: options.pageExtensions,
    ignore: options.routesIgnore,
    cwd: options.root
  });

  const pathPlatform = process.platform === "win32" ? path.win32 : path.posix;
  let listener = function handleFileChange(/** @type {string} */ file) {
    schedule(() => {
      if (router.watcher) {
        router.watcher.close();
      }
      server?.restart();
      // eslint-disable-next-line no-console
      console.log(
        c.dim(new Date().toLocaleTimeString()) +
          c.bold(c.blue(" [plugin-restart] ")) +
          c.yellow(`restarting server by ${pathPlatform.relative(root, file)}`)
      );
    });
  };
  return {
    name: "solid-start-file-system-router",
    enforce: "pre",
    config(c) {
      if (!enableGlob) return;
      if (!c.server) c.server = {};
      if (!c.server.watch) c.server.watch = {};
      c.server.watch.disableGlobbing = false;
    },
    async configResolved(config) {
      lazy = config.command !== "serve" || options.lazy === true;
      await router.init();
      // famous last words, but this *appears* to always be an absolute path
      // with all slashes normalized to forward slashes `/`. this is compatible
      // with path.posix.join, so we can use it to make an absolute path glob
      root = config.root;
    },
    configureServer(vite) {
      server = vite;
      router.watch(console.log);
      router.listener = listener;
      if (!vite.httpServer) return;
      vite.httpServer.once("listening", async () => {
        setTimeout(() => {
          if (vite.resolvedUrls) {
            const url = vite.resolvedUrls.local[0];
            // eslint-disable-next-line no-console
            printUrls(router, url.substring(0, url.length - 1));
          }
        }, 100);
      });
    },

    transform(code, id, transformOptions) {
      const isSsr =
        transformOptions === null || transformOptions === void 0 ? void 0 : transformOptions.ssr;

      const url = pathToFileURL(id);
      url.searchParams.delete("v");
      id = fileURLToPath(url).replace(/\\/g, "/");

      /**
       * @param {string} code
       * @param {string} id
       * @param {(source: string, id: string, ssr: boolean) => import('@babel/core').TransformOptions} fn
       */
      let babelSolidCompiler = (code, id, fn) => {
        // @ts-ignore
        let plugin = solid({
          ...(options ?? {}),
          ssr: process.env.START_SPA_CLIENT === "true" ? false : true,
          babel: mergeBabelOptions(options, fn)
        });

        // @ts-ignore
        return plugin.transform(code, id, transformOptions);
      };

      let ssr = process.env.TEST_ENV === "client" ? false : isSsr;

      if (/\.test\.(tsx)/.test(id)) {
        return babelSolidCompiler(code, id, (_source, _id) => ({
          plugins: [
            [
              routeResource,
              {
                ssr,
                root: process.cwd(),
                minify: process.env.NODE_ENV === "production"
              }
            ],
            [
              babelServerModule,
              {
                ssr,
                root: process.cwd(),
                minify: process.env.NODE_ENV === "production"
              }
            ]
          ]
        }));
      }

      if (/\.data\.(ts|js)/.test(id)) {
        return babelSolidCompiler(code, id.replace(/\.data\.ts/, ".tsx"), (_source, _id) => ({
          plugins: [
            [
              routeResource,
              {
                ssr,
                root: process.cwd(),
                minify: process.env.NODE_ENV === "production"
              }
            ],
            [
              babelServerModule,
              {
                ssr,
                root: process.cwd(),
                minify: process.env.NODE_ENV === "production"
              }
            ]
          ]
        }));
      } else if (/\?data/.test(id)) {
        return babelSolidCompiler(code, id.replace("?data", ""), (_source, _id) => ({
          plugins: [
            [
              routeResource,
              {
                ssr,
                root: process.cwd(),
                minify: process.env.NODE_ENV === "production"
              }
            ],
            [
              babelServerModule,
              {
                ssr,
                root: process.cwd(),
                minify: process.env.NODE_ENV === "production"
              }
            ],
            [
              routeData,
              {
                ssr,
                root: process.cwd(),
                minify: process.env.NODE_ENV === "production"
              }
            ],
            ...(!ssr && process.env.NODE_ENV !== "production"
              ? [[routeDataHmr, { ssr, root: process.cwd() }]]
              : [])
          ]
        }));
      } else if (id.includes(path.posix.join(options.appRoot, options.routesDir))) {
        return babelSolidCompiler(code, id.replace("?data", ""), (_source, _id) => ({
          plugins: [
            [
              routeResource,
              {
                ssr,
                root: process.cwd(),
                keep: true,
                minify: process.env.NODE_ENV === "production"
              }
            ],
            [
              babelServerModule,
              {
                ssr,
                root: process.cwd(),
                minify: process.env.NODE_ENV === "production"
              }
            ],
            [
              routeData,
              {
                ssr,
                root: process.cwd(),
                keep: true,
                minify: process.env.NODE_ENV === "production"
              }
            ]
          ].filter(Boolean)
        }));
      } else if (code.includes("solid-start/server")) {
        return babelSolidCompiler(
          code,
          id.replace(/\.ts$/, ".tsx").replace(/\.js$/, ".jsx"),
          (_source, _id) => ({
            plugins: [
              [
                routeResource,
                {
                  ssr,
                  root: process.cwd(),
                  keep: true,
                  minify: process.env.NODE_ENV === "production"
                }
              ],
              [
                babelServerModule,
                {
                  ssr,
                  root: process.cwd(),
                  minify: process.env.NODE_ENV === "production"
                }
              ]
            ].filter(Boolean)
          })
        );
      } else if (code.includes("var fileRoutes = $FILE_ROUTES;")) {
        return {
          code: code.replace(
            "var fileRoutes = $FILE_ROUTES;",
            !options.ssr && ssr
              ? "var fileRoutes = [];"
              : stringifyPageRoutes(router.getNestedPageRoutes(), {
                  lazy: ssr ? false : true
                })
          )
        };
      } else if (code.includes("var routeLayouts = $ROUTE_LAYOUTS;")) {
        return {
          code: code.replace(
            "var routeLayouts = $ROUTE_LAYOUTS;",
            `const routeLayouts = ${JSON.stringify(router.getRouteLayouts())};`
          )
        };
      } else if (code.includes("var api = $API_ROUTES;")) {
        return {
          code: code.replace(
            "var api = $API_ROUTES;",
            stringifyApiRoutes(router.getFlattenedApiRoutes(true), { lazy })
          )
        };
      }
    }
  };
}

/**
 * @returns {import('vite').Plugin}
 * @param {any} options
 */
function solidStartCsrDev(options) {
  let csrDev = false;
  return {
    name: "solid-start-csr-dev",
    async configResolved(config) {
      csrDev = config.command === "serve" && options.ssr !== true;
    },
    async transform(code, id, transformOptions) {
      const isSsr =
        transformOptions === null || transformOptions === void 0 ? void 0 : transformOptions.ssr;
      if (isSsr && csrDev && code.includes("~start/root")) {
        return {
          code: code.replace(
            "~start/root",
            join(_dirname, "..", "dev", "CsrRoot.tsx").replaceAll("\\", "/")
          )
        };
      }
    }
  };
}

/**
 * @returns {import('vite').Plugin}
 */
function solidStartServer() {
  /** @type {{ cssModules: { [id: string]: string } }} */
  let env = { cssModules: {} };
  const module_style_pattern = /\.module\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/;
  return {
    name: "solid-start-server",
    config(c) {
      return {
        appType: "custom",
        build: {
          target: "esnext",
          manifest: true
        }
      };
    },
    transform(code, id) {
      if (module_style_pattern.test(id)) {
        env.cssModules[id] = code;
      }
    }
  };
}

/**
 * @param {SolidStartOptions} options
 * @returns {import('vite').Plugin}
 */
function solidStartConfig(options) {
  return {
    name: "solid-start-config",
    enforce: "pre",
    async config(conf, e) {
      const root = conf.root || process.cwd();
      options.root = root;
      options.env = await loadEnv(e.mode, options.envDir || process.cwd());

      options.clientEntry =
        options.clientEntry ?? findAny(join(options.root, options.appRoot), "entry-client");
      if (!options.clientEntry) {
        options.clientEntry = join(_dirname, "..", "virtual", "entry-client.tsx");
      }
      options.serverEntry =
        options.serverEntry ?? findAny(join(options.root, options.appRoot), "entry-server");
      if (!options.serverEntry) {
        options.serverEntry = join(_dirname, "..", "virtual", "entry-server.tsx");
      }

      options.rootEntry = options.rootEntry ?? findAny(join(options.root, options.appRoot), "root");
      if (!options.rootEntry) {
        options.rootEntry = join(_dirname, "..", "virtual", "root.tsx");
      }

      DEBUG(options);

      return {
        resolve: {
          conditions: options.env["VITEST"] ? ["browser", "solid"] : ["solid"],
          alias: {
            "~": path.join(root, options.appRoot),
            "~start/root": options.rootEntry,
            "~start/entry-client": options.clientEntry,
            "~start/entry-server": options.serverEntry
          }
        },

        ssr: {
          noExternal: ["solid-start", "@solidjs/meta", "@solidjs/router"]
        },

        envPrefix: "PUBLIC_",

        define: {
          // handles use of process.env.TEST_ENV in solid-start internal code
          "process.env.TEST_ENV": JSON.stringify(process.env.TEST_ENV),
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
          "import.meta.env.START_SSR": JSON.stringify(options.ssr ? true : false),
          "import.meta.env.START_ISLANDS": JSON.stringify(options.islands ? true : false),
          "import.meta.env.START_ENTRY_CLIENT": JSON.stringify(options.clientEntry),
          "import.meta.env.START_ENTRY_SERVER": JSON.stringify(options.serverEntry),
          "import.meta.env.START_ISLANDS_ROUTER": JSON.stringify(
            options.islandsRouter ? true : false
          ),
          _$DEBUG: process.env.NODE_ENV === "production" ? "(() => {})" : "globalThis._$DEBUG"
        },
        optimizeDeps: {
          exclude: ["solid-start", "@solidjs/router", "@solidjs/meta"],
          extensions: ["jsx", "tsx"],
          esbuildOptions: {
            plugins: [
              solidPlugin({
                solid: {
                  hydratable: options.ssr ? true : false,
                  generate: "dom"
                }
              })
            ]
          }
        },
        solidOptions: options
      };
    }
  };
}

/**
 * @param {string} path
 * @param {string} name
 * @param {string[]} exts
 */
const findAny = (path, name, exts = [".js", ".ts", ".jsx", ".tsx", ".mjs", ".mts"]) => {
  for (var ext of exts) {
    const file = join(path, name + ext);
    if (existsSync(file)) {
      return file;
    }
  }
  return undefined;
};

/**
 * @param {Partial<import('./plugin.js').Options>} options
 */
function mergeOptions(options) {
  return Object.assign(
    {
      appRoot: "src",
      routesDir: "routes",
      ssr: process.env.START_SSR === "false" ? false : true,
      islands: process.env.START_ISLANDS === "true" ? true : false,
      islandsRouter: process.env.START_ISLANDS_ROUTER === "true" ? true : false,
      lazy: true,
      prerenderRoutes: [],
      devServer: true,
      inspect: true,
      routesIgnore: []
    },
    options ?? {},
    {
      pageExtensions: [
        "tsx",
        "jsx",
        "js",
        "ts",
        ...((options.extensions &&
          options.extensions.map(s => (Array.isArray(s) ? s[0] : s)).map(s => s.slice(1))) ||
          [])
      ]
    }
  );
}

/**
 * @param {Partial<import('./plugin.js').Options>} _options
 * @returns {import('vite').PluginOption[]}
 */
export default function solidStart(_options) {
  const options = mergeOptions(_options);

  DEBUG("options", options);

  return [
    solidStartConfig(options),
    solidStartFileSystemRouter(options),
    !options.ssr && solidStartCsrDev(options),
    options.islands ? islands() : undefined,
    // options.inspect ? inspect({ outputDir: join(".solid", "inspect"), build: true }) : undefined,
    options.ssr && solidStartInlineServerModules(),
    solid({
      ...options,
      // if we are building the SPA client for production, we set ssr to false
      ssr: process.env.START_SPA_CLIENT === "true" ? false : true,
      babel: mergeBabelOptions(options, (_source, _id, ssr) => ({
        plugins: [
          [fileRoutesImport],
          [
            routeResource,
            {
              ssr,
              root: process.cwd(),
              minify: process.env.NODE_ENV === "production"
            }
          ],
          [
            babelServerModule,
            {
              ssr,
              root: process.cwd(),
              minify: process.env.NODE_ENV === "production"
            }
          ]
        ]
      }))
    }),
    solidStartServer()
  ].filter(Boolean);
}

/**
 * @returns {import('vite').Plugin}
 */
function islands() {
  return {
    name: "solid-start-islands",
    load(id) {
      if (id.endsWith("?island")) {
        return {
          code: `
            import Component from '${id.replace("?island", "")}';

            window._$HY.island("${id.slice(process.cwd().length)}", Component);

            export default Component;
            `
        };
      }
    },
    transform(code, id, ssr) {
      if (code.includes("unstable_island")) {
        let replaced = code.replaceAll(
          /const ([A-Za-z_]+) = unstable_island\(\(\) => import\((("([^"]+)")|('([^']+)'))\)\)/g,
          (a, b, c) => {
            c = c.slice(1, -1);
            return ssr
              ? `import ${b}_island from "${c}";
                  const ${b} = unstable_island(${b}_island, "${
                  join(dirname(id), c)
                    .slice(process.cwd().length + 1)
                    .replaceAll("\\", "/") +
                  ".tsx" +
                  "?island"
                }");`
              : `const ${b} = unstable_island(() => import("${c}?island"), "${
                  join(dirname(id), c).replaceAll("\\", "/") + ".tsx" + "?island"
                }")`;
          }
        );

        return replaced;
      }
    }
  };
}
