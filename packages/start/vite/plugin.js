/// <reference path="./plugin.d.ts" />

import debug from "debug";
import dotenv from "dotenv";
import { solidPlugin } from "esbuild-plugin-solid";
import fs, { existsSync } from "fs";
import path, { dirname, join } from "path";
import c from "picocolors";
import { fileURLToPath, pathToFileURL } from "url";
import { loadEnv, normalizePath } from "vite";
import inspect from "vite-plugin-inspect";
import solid from "vite-plugin-solid";
import printUrls from "../dev/print-routes.js";
import fileRoutesImport from "../fs-router/fileRoutesImport.js";
import { Router, stringifyApiRoutes, stringifyPageRoutes } from "../fs-router/router.js";
import routeData from "../server/routeData.js";
import routeDataHmr from "../server/routeDataHmr.js";
import babelServerModule from "../server/server-functions/babel.js";
import routeResource from "../server/serverResource.js";

// @ts-ignore
globalThis.DEBUG = debug("start:vite");

let _dirname = dirname(fileURLToPath(import.meta.url));
// const _dirname = dirname(fileURLToPath(`${import.meta.url}`));

/**
 * @returns {import('vite').PluginOption}
 * @param {any} options
 */
function solidStartInlineServerModules(options) {
  let lazy;
  let config;
  /** @type {import('vite').Plugin} */
  return {
    enforce: "pre",
    configResolved(_config) {
      lazy = _config.command !== "serve";
      config = _config;
    },
    name: "solid-start-inline-server-modules",
    configureServer(vite) {
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
 * @param {any} arr
 */
function toArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  return [arr];
}

/**
 * @returns {import('vite').Plugin}
 * @param {{ lazy?: any; restart?: any; reload?: any; ssr?: any; appRoot?: any; routesDir?: any; delay?: any; glob?: any; router?: any; babel?: any }} options
 */
function solidStartFileSystemRouter(options) {
  let lazy;
  let config;

  let { delay = 500, glob: enableGlob = true, router } = options;
  let root = process.cwd();
  let reloadGlobs = [];
  let restartGlobs = [];
  let configFile = "vite.config.js";
  let timerState = "reload";
  let timer;
  const pathPlatform = process.platform === "win32" ? path.win32 : path.posix;
  function clear() {
    clearTimeout(timer);
  }
  /**
   * @param {{ (): void; (): void; }} fn
   */
  function schedule(fn) {
    clear();
    timer = setTimeout(fn, delay);
  }

  let server;

  let listener = function handleFileChange(/** @type {string} */ file) {
    timerState = "restart";
    schedule(() => {
      if (router.watcher) {
        router.watcher.close();
      }
      server.restart();
      // eslint-disable-next-line no-console
      console.log(
        c.dim(new Date().toLocaleTimeString()) +
          c.bold(c.blue(" [plugin-restart] ")) +
          c.yellow(`restarting server by ${pathPlatform.relative(root, file)}`)
      );
      timerState = "";
    });
    // } else if (micromatch.isMatch(file, reloadGlobs) && timerState !== "restart") {
    //   timerState = "reload";
    //   schedule(() => {
    //     server.ws.send({ type: "full-reload" });
    //     timerState = "";
    //   });
  };
  return {
    name: "solid-start-file-system-router",
    enforce: "pre",
    config(c) {
      if (!enableGlob) return;
      if (!c.server) c.server = {};
      if (!c.server.watch) c.server.watch = {};
      c.server.watch.disableGlobbing = false;

      // @ts-expect-error
      router = c.solidOptions.router;
    },
    async configResolved(_config) {
      lazy = _config.command !== "serve" || options.lazy === true;
      config = _config;
      await router.init();

      configFile = _config.configFile;
      // famous last words, but this *appears* to always be an absolute path
      // with all slashes normalized to forward slashes `/`. this is compatible
      // with path.posix.join, so we can use it to make an absolute path glob
      root = config.root;
      restartGlobs = toArray(options.restart).map(i => path.posix.join(root, i));
      reloadGlobs = toArray(options.reload).map(i => path.posix.join(root, i));
    },
    configureServer(vite) {
      server = vite;
      router.watch(console.log);
      router.listener = listener;
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

      const babelOptions =
        fn =>
        (...args) => {
          const b =
            typeof options.babel === "function"
              ? options.babel(...args)
              : options.babel ?? { plugins: [] };
          const d = fn(...args);
          return {
            plugins: [...b.plugins, ...d.plugins]
          };
        };
      let babelSolidCompiler = (/** @type {string} */ code, /** @type {string} */ id, fn) => {
        // @ts-ignore
        let plugin = solid({
          ...(options ?? {}),
          ssr: process.env.START_SPA_CLIENT === "true" ? false : true,
          babel: babelOptions(fn)
        });

        // @ts-ignore
        return plugin.transform(code, id, transformOptions);
      };

      let ssr = process.env.TEST_ENV === "client" ? false : isSsr;

      if (/\.test\.(tsx)/.test(id)) {
        return babelSolidCompiler(code, id, (/** @type {any} */ source, /** @type {any} */ id) => ({
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
        return babelSolidCompiler(
          code,
          id.replace(/\.data\.ts/, ".tsx"),
          (/** @type {any} */ source, /** @type {any} */ id) => ({
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
          })
        );
      } else if (/\?data/.test(id)) {
        return babelSolidCompiler(
          code,
          id.replace("?data", ""),
          (/** @type {any} */ source, /** @type {any} */ id) => ({
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
              !ssr &&
                process.env.NODE_ENV !== "production" && [
                  routeDataHmr,
                  { ssr, root: process.cwd() }
                ]
            ].filter(Boolean)
          })
        );
      } else if (id.includes(path.posix.join(options.appRoot, options.routesDir))) {
        return babelSolidCompiler(
          code,
          id.replace("?data", ""),
          (/** @type {any} */ source, /** @type {any} */ id) => ({
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
          })
        );
      } else if (code.includes("solid-start/server")) {
        return babelSolidCompiler(
          code,
          id.replace(/\.ts$/, ".tsx").replace(/\.js$/, ".jsx"),
          (/** @type {any} */ source, /** @type {any} */ id) => ({
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
            !options.ssr && ssr ? "var fileRoutes = [];" :
            stringifyPageRoutes(router.getNestedPageRoutes(), {
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
 * @param {{ pageExtensions: any[]; }} options
 */
function solidsStartRouteManifest(options) {
  return {
    name: "solid-start-route-manifest",
    config(conf) {
      const regex = new RegExp(`\\.(${options.pageExtensions.join("|")})$`);
      const root = normalizePath(conf.root || process.cwd());
      return {
        build: {
          target: "esnext",
          manifest: true
        }
      };
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
      const isSsr = transformOptions === null || transformOptions === void 0 ? void 0 : transformOptions.ssr;
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

async function resolveAdapter(config) {
  if (typeof config.solidOptions.adapter === "string") {
    return (await import(config.solidOptions.adapter)).default();
  } else if (Array.isArray(config.solidOptions.adapter)) {
    return (await import(config.solidOptions.adapter[0])).default(config.solidOptions.adapter[1]);
  } else {
    return config.solidOptions.adapter;
  }
}

/**
 * @returns {import('vite').Plugin}
 * @param {any} options
 */
function solidStartServer(options) {
  let config;
  let env = { cssModules: {} };
  const module_style_pattern = /\.module\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/;
  return {
    name: "solid-start-server",
    config(c) {
      config = c;
      return {
        appType: "custom"
      };
    },
    transform(code, id) {
      if (module_style_pattern.test(id)) {
        env.cssModules[id] = code;
      }
    },
    configureServer(vite) {
      return async () => {
        const { createDevHandler } = await import("../dev/server.js");
        let adapter = await resolveAdapter(config);
        if (adapter && adapter.dev) {
          vite.middlewares.use(
            await adapter.dev(config, vite, createDevHandler(vite, config, options))
          );
        } else if (config.solidOptions.devServer) {
          vite.middlewares.use(createDevHandler(vite, config, options).handlerWithEnv(env));
        }
      };
    }
  };
}

// credits to https://github.com/nuxt/nuxt.js/blob/dev/packages/config/src/load.js
function loadServerEnv(envConfig, rootDir = process.cwd()) {
  const env = Object.create(null);
  if (!envConfig.dotenv) return env;
  const t = [...envConfig.dotenv];
  for (const denv of t) {
    // Read dotenv
    envConfig.dotenv = path.resolve(rootDir, denv);
    if (fs.existsSync(envConfig.dotenv)) {
      const parsed = dotenv.parse(fs.readFileSync(envConfig.dotenv, "utf-8"));
      Object.assign(env, parsed);
    }

    // Apply process.env
    if (!envConfig.env._applied) {
      Object.assign(env, envConfig.env);
      envConfig.env._applied = true;
    }

    // Interpolate env
    if (envConfig.expand) {
      expand(env);
    }
  }

  return env;
}

// Based on https://github.com/motdotla/dotenv-expand
function expand(target, source = {}, parse = v => v) {
  function getValue(key) {
    // Source value 'wins' over target value
    return source[key] !== undefined ? source[key] : target[key];
  }

  function interpolate(value, parents = []) {
    if (typeof value !== "string") {
      return value;
    }
    const matches = value.match(/(.?\${?(?:[a-zA-Z0-9_:]+)?}?)/g) || [];
    return parse(
      matches.reduce((newValue, match) => {
        const parts = /(.?)\${?([a-zA-Z0-9_:]+)?}?/g.exec(match);
        const prefix = parts[1];

        let value, replacePart;

        if (prefix === "\\") {
          replacePart = parts[0];
          value = replacePart.replace("\\$", "$");
        } else {
          const key = parts[2];
          replacePart = parts[0].substring(prefix.length);

          // Avoid recursion
          if (parents.includes(key)) {
            consola.warn(
              `Please avoid recursive environment variables ( loop: ${parents.join(
                " > "
              )} > ${key} )`
            );
            return "";
          }

          value = getValue(key);

          // Resolve recursive interpolations
          value = interpolate(value, [...parents, key]);
        }

        return value !== undefined ? newValue.replace(replacePart, value) : newValue;
      }, value)
    );
  }

  for (const key in target) {
    target[key] = interpolate(getValue(key));
  }
}


/**
 * @returns {import('vite').Plugin}
 * @param {any} options
 */
function solidStartConfig(options) {
  return {
    name: "solid-start-config",
    enforce: "pre",
    async config(conf, e) {
      const root = conf.root || process.cwd();
      options.root = root;

      // Load env file based on `mode` in the current working directory.
      // credits to https://github.com/nuxt/nuxt.js/blob/dev/packages/config/src/load.js for the server env
      const envConfig = {
        dotenv: [
          /** default file */ `.env`,
          /** local file */ `.env.local`,
          /** mode file */ `.env.${e.mode}`,
          /** mode local file */ `.env.${e.mode}.local`
        ],
        env: process.env,
        expand: true,
        ...(options?.envConfig ?? {})
      };
      const env = loadServerEnv(envConfig, options.envDir || process.cwd());
      for (const key in env) {
        if (!key.startsWith("VITE_") && envConfig.env[key] === undefined) {
          envConfig.env[key] = env[key];
        }
      }
      options._env = env;
      options._envConfig = envConfig;
      options.env = await loadEnv(e.mode, options.envDir || process.cwd());
      options.router = new Router({
        baseDir: path.posix.join(options.appRoot, options.routesDir),
        pageExtensions: options.pageExtensions,
        ignore: options.routesIgnore,
        cwd: options.root
      });

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

        define: {
          // handles use of process.env.TEST_ENV in solid-start internal code
          "process.env.TEST_ENV": JSON.stringify(process.env.TEST_ENV),
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
          "import.meta.env.START_SSR": JSON.stringify(options.ssr ? true : false),
          "import.meta.env.START_ISLANDS": JSON.stringify(options.islands ? true : false),
          "import.meta.env.START_ENTRY_CLIENT": JSON.stringify(options.clientEntry),
          "import.meta.env.START_ENTRY_SERVER": JSON.stringify(options.serverEntry),
          "import.meta.env.START_INDEX_HTML": JSON.stringify(
            process.env.START_INDEX_HTML === "true" ? true : false
          ),
          "import.meta.env.START_ISLANDS_ROUTER": JSON.stringify(
            options.islandsRouter ? true : false
          ),
          _$DEBUG: process.env.NODE_ENV === "production" ? "(() => {})" : "globalThis._$DEBUG",
          "import.meta.env.START_ADAPTER": JSON.stringify(
            typeof options.adapter === "string"
              ? options.adapter
              : options.adapter && options.adapter.name
          )
        },
        optimizeDeps: {
          exclude: ["solid-start", "@solidjs/router", "@solidjs/meta"],
          extensions: ["jsx", "tsx"],
          esbuildOptions: {
            plugins: [
              solidPlugin({
                hydratable: options.ssr ? true : false,
                generate: "dom"
              })
            ]
          }
        },
        solidOptions: options
      };
    }
  };
}

const findAny = (path, name, exts = [".js", ".ts", ".jsx", ".tsx", ".mjs", ".mts"]) => {
  for (var ext of exts) {
    const file = join(path, name + ext);
    if (existsSync(file)) {
      return file;
    }
  }
  return null;
};

/**
 * @returns {import('vite').PluginOption[]}
 */
export default function solidStart(options) {
  options = Object.assign(
    {
      adapter: process.env.START_ADAPTER ? process.env.START_ADAPTER : "solid-start-node",
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
    options ?? {}
  );

  DEBUG("options", options);

  options.pageExtensions = [
    "tsx",
    "jsx",
    "js",
    "ts",
    ...((options.extensions &&
      options.extensions
        .map((/** @type {any[]} */ s) => (Array.isArray(s) ? s[0] : s))
        .map((/** @type {string | any[]} */ s) => s.slice(1))) ||
      [])
  ];

  const babelOptions =
    fn =>
    (...args) => {
      const b =
        typeof options.babel === "function"
          ? options.babel(...args)
          : options.babel ?? { plugins: [] };
      const d = fn(...args);
      return {
        plugins: [...b.plugins, ...d.plugins]
      };
    };

  return [
    solidStartConfig(options),
    solidStartFileSystemRouter(options),
    !options.ssr && solidStartCsrDev(options),
    options.islands ? islands() : undefined,
    options.inspect ? inspect({ outputDir: join(".solid", "inspect"), build: true }) : undefined,
    options.ssr && solidStartInlineServerModules(options),
    solid({
      ...(options ?? {}),
      // if we are building the SPA client for production, we set ssr to false
      ssr: process.env.START_SPA_CLIENT === "true" ? false : true,
      babel: babelOptions(
        (/** @type {any} */ source, /** @type {any} */ id, /** @type {any} */ ssr) => ({
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
        })
      )
    }),
    solidStartServer(options),
    solidsStartRouteManifest(options)
  ].filter(Boolean);
}

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
    /**
     * @param {any} id
     * @param {string} code
     */
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
