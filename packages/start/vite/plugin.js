/// <reference path="./plugin.d.ts" />

import debug from "debug";
import dotenv from "dotenv";
import { solidPlugin } from "esbuild-plugin-solid";
import fs, { existsSync } from "fs";
import path, { dirname, join } from "path";
import c from "picocolors";
import { fileURLToPath, pathToFileURL } from "url";
import { loadEnv } from "vite";
import inspect from "vite-plugin-inspect";
import solid from "vite-plugin-solid";
import printUrls from "../dev/print-routes.js";
import fileRoutesImport from "../fs-router/move-import.babel.js";
import { Router, stringifyAPIRoutes, stringifyPageRoutes } from "../fs-router/router.js";
import { islands } from "../islands/vite-plugin.js";
import routeData from "../server/routeData.js";
import routeDataHmr from "../server/routeDataHmr.js";
import babelServerModule from "../server/server-functions/babel.js";
import routeResource from "../server/serverResource.js";

// @ts-ignore
globalThis._$DEBUG = debug("start:vite");
let _dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @returns {import('vite').Plugin}
 * @param {import('./plugin').Options} options
 */
function solidStartConfig(options) {
  return {
    name: "solid-start-config",
    enforce: "pre",
    async config(conf, e) {
      const root = conf.root || process.cwd();
      options.root = root;

      // Load env file based on `mode` in the current working directory.
      // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.

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

      let routeExtensions = [
        "tsx",
        "jsx",
        "js",
        "ts",
        ...((options.extensions &&
          options.extensions
            .map((/** @type {string | [string, any]} */ s) => (Array.isArray(s) ? s[0] : s))
            .map((/** @type {string} */ s) => s.slice(1))) ||
          [])
      ];

      let include = new RegExp(`\\.(${routeExtensions.join("|")})$`);

      options.router = new Router({
        baseDir: path.posix.join(options.appRoot, options.routesDir),
        include,
        // exclude: options.routesIgnore,
        cwd: root
      });

      options.clientEntry =
        options.clientEntry ?? findAny(join(root, options.appRoot), "entry-client");
      if (!options.clientEntry) {
        options.clientEntry = join(_dirname, "..", "virtual", "entry-client.tsx");
      }
      options.serverEntry =
        options.serverEntry ?? findAny(join(root, options.appRoot), "entry-server");
      if (!options.serverEntry) {
        options.serverEntry = join(_dirname, "..", "virtual", "entry-server.tsx");
      }

      options.rootEntry = options.rootEntry ?? findAny(join(root, options.appRoot), "root");
      if (!options.rootEntry) {
        options.rootEntry = join(_dirname, "..", "virtual", "root.tsx");
      }

      _$DEBUG(options);

      return {
        root,

        resolve: {
          conditions: env["VITEST"] ? ["browser", "solid"] : ["solid"],
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
          "import.meta.env.START_SSR": JSON.stringify(
            options.ssr === true ? "async" : options.ssr ? options.ssr : false
          ),
          "import.meta.env.START_ISLANDS": JSON.stringify(
            options.experimental.islands ? true : false
          ),
          "import.meta.env.START_ENTRY_CLIENT": JSON.stringify(options.clientEntry),
          "import.meta.env.START_ENTRY_SERVER": JSON.stringify(options.serverEntry),
          "import.meta.env.START_INDEX_HTML": JSON.stringify(
            process.env.START_INDEX_HTML === "true" ? true : false
          ),
          "import.meta.env.START_ISLANDS_ROUTER": JSON.stringify(
            options.experimental.islandsRouter ? true : false
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
/**
 * @returns {import('vite').Plugin}
 * @param {{ delay?: number } & Partial<import("vite-plugin-solid").Options>} options
 */
function solidStartFileSystemRouter(options) {
  /** @type {import('./plugin').ViteConfig} */
  let config;

  let { delay = 500 } = options;

  const pathPlatform = process.platform === "win32" ? path.win32 : path.posix;

  /** @type {NodeJS.Timeout} */
  let timer;
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

  /** @type {import("vite").ViteDevServer} */
  let server;

  let listener = function handleFileChange(/** @type {string} */ file) {
    schedule(() => {
      if (config.solidOptions.router.watcher) {
        config.solidOptions.router.watcher.close();
      }
      server.restart();

      // eslint-disable-next-line no-console
      console.log(
        c.dim(new Date().toLocaleTimeString()) +
          c.bold(c.blue(" [plugin-restart] ")) +
          c.yellow(`restarting server by ${pathPlatform.relative(config.root, file)}`)
      );
    });
  };

  /** @type {boolean} */
  let lazy = true;

  const babelOptions =
    (/** @type {any} */ getBabelOptions) =>
    async (/** @type {string} */ source, /** @type {string} */ id, /** @type {boolean} */ ssr) => {
      const userBabelOptions =
        typeof options.babel === "function"
          ? await options.babel(source, id, ssr)
          : options.babel ?? { plugins: [] };
      const localBabelOptions = getBabelOptions(source, id, ssr);
      return {
        plugins: [...(userBabelOptions.plugins ?? []), ...localBabelOptions.plugins]
      };
    };

  return {
    name: "solid-start-file-system-router",
    enforce: "pre",
    async configResolved(_config) {
      // @ts-expect-error
      config = _config;

      lazy = _config.command !== "serve";
      await config.solidOptions.router.init();
    },
    configureServer(vite) {
      server = vite;
      config.solidOptions.router.watch();
      config.solidOptions.router.listener = listener;

      if (vite.httpServer) {
        vite.httpServer.once("listening", async () => {
          setTimeout(() => {
            if (vite.resolvedUrls) {
              const url = vite.resolvedUrls.local[0];
              // eslint-disable-next-line no-console
              printUrls(config.solidOptions.router, url.substring(0, url.length - 1));
            }
          }, 100);
        });
      }
    },

    transform(code, id, transformOptions) {
      const isSsr =
        transformOptions === null || transformOptions === void 0 ? void 0 : transformOptions.ssr;

      const url = pathToFileURL(id);
      url.searchParams.delete("v");
      id = fileURLToPath(url).replace(/\\/g, "/");

      let babelSolidCompiler = (
        /** @type {string} */ code,
        /** @type {string} */ id,
        /** @type {any} */ fn
      ) => {
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
      } else if (
        id.includes(path.posix.join(config.solidOptions.appRoot, config.solidOptions.routesDir))
      ) {
        return babelSolidCompiler(code, id, (/** @type {any} */ source, /** @type {any} */ id) => ({
          plugins: [
            [
              routeResource,
              {
                ssr,
                root: config.root,
                keep: true,
                minify: process.env.NODE_ENV === "production"
              }
            ],
            [
              babelServerModule,
              {
                ssr,
                root: config.root,
                minify: process.env.NODE_ENV === "production"
              }
            ],
            [
              routeData,
              {
                ssr,
                root: config.root,
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
            !config.solidOptions.ssr && ssr ? "var fileRoutes = [];" :
            stringifyPageRoutes(config.solidOptions.router.getNestedPageRoutes(), {
              lazy: ssr ? false : true
            })
          )
        };
      } else if (code.includes("var routeLayouts = $ROUTE_LAYOUTS;")) {
        return {
          code: code.replace(
            "var routeLayouts = $ROUTE_LAYOUTS;",
            `const routeLayouts = /*#__PURE__*/ ${JSON.stringify(
              config.solidOptions.router.getRouteLayouts()
            )};`
          )
        };
      } else if (code.includes("var api = $API_ROUTES;")) {
        return {
          code: code.replace(
            "var api = $API_ROUTES;",
            stringifyAPIRoutes(config.solidOptions.router.getFlattenedApiRoutes(true), { lazy })
          )
        };
      }
    }
  };
}

/**
 * @returns {import('vite').Plugin}
 * @param {import('./plugin').Options} options
 */
function solidStartRouteManifest(options) {
  return {
    name: "solid-start-route-manifest",
    config() {
      return {
        build: {
          target: "esnext",
          manifest: true
        }
      };
    }
  };
}

async function resolveAdapter(/** @type {import('./plugin').ViteConfig} */ config) {
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

/**
 * @returns {import('vite').Plugin}
 * @param {any} options
 */
function solidStartServer(options) {
  /** @type {import('./plugin').ViteConfig}  */
  let config;

  /** @type {{ cssModules: { [key: string]: any }}} */
  let env = { cssModules: {} };
  const module_style_pattern = /\.module\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/;
  return {
    name: "solid-start-server",
    config(c) {
      // @ts-expect-error
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
        } else {
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
            console.warn(
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
 * @param {import('./plugin').Options} options
 * @returns {import('vite').PluginOption[]}
 */
export default function solidStart(options) {
  options = Object.assign(
    {
      adapter: process.env.START_ADAPTER ? process.env.START_ADAPTER : "solid-start-node",
      appRoot: "src",
      routesDir: "routes",
      ssr:
        process.env.START_SSR === "false"
          ? false
          : process.env.START_SSR === "true"
          ? "async"
          : process.env.START_SSR?.length
          ? process.env.START_SSR
          : "async",
      lazy: true,
      prerenderRoutes: [],
      devServer: true,
      inspect: true,
      experimental: {
        islands: process.env.START_ISLANDS === "true" ? true : false,
        islandsRouter: process.env.START_ISLANDS_ROUTER === "true" ? true : false
      }
    },
    options ?? {}
  );

  _$DEBUG("options", options);

  return [
    solidStartConfig(options),
    solidStartFileSystemRouter({ delay: 500, typescript: options.typescript, solid: options.solid }),
    !options.ssr && solidStartCsrDev(options),
    options.inspect ? inspect({ outDir: join(".solid", "inspect") }) : undefined,
    options.experimental.islands ? islands() : undefined,
    solidTransformer(options),
    solidStartServer(options),
    solidStartRouteManifest(options)
  ].filter(Boolean);
}

/**
 *
 * @param {import('./plugin').Options} options
 * @returns {import('vite').Plugin}
 */
function solidTransformer(options) {
  const babelOptions =
    (/** @type {any} */ getBabelOptions) =>
    async (/** @type {string} */ source, /** @type {string} */ id, /** @type {boolean} */ ssr) => {
      const userBabelOptions =
        typeof options.babel === "function"
          ? await options.babel(source, id, ssr)
          : options.babel ?? { plugins: [] };
      const localBabelOptions = getBabelOptions(source, id, ssr);
      return {
        plugins: [...(userBabelOptions.plugins ?? []), ...localBabelOptions.plugins]
      };
    };

  return solid({
    ...(options ?? {}),
    // if we are building the SPA client for production, we set ssr to false
    ssr: process.env.START_SPA_CLIENT === "true" ? false : true,
    babel: babelOptions(
      (/** @type {string} */ source, /** @type {string} */ id, /** @type {boolean} */ ssr) => ({
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
  });
}

export function createAdapter(/** @type {import('./plugin').Adapter} */ adapter) {
  return adapter;
}
