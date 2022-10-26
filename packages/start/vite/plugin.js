import inspect from "@vinxi/vite-plugin-inspect";
import debug from "debug";
import { parse } from "es-module-lexer";
import esbuild from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";
import fs, { existsSync } from "fs";
import path, { dirname, join, relative } from "path";
import c from "picocolors";
import { fileURLToPath, pathToFileURL } from "url";
import { loadEnv, normalizePath } from "vite";
import solid from "vite-plugin-solid";
import printUrls from "../dev/print-routes.js";
import { Router, stringifyApiRoutes, stringifyPageRoutes } from "../fs-router/router.js";
import routeData from "../server/routeData.js";
import routeDataHmr from "../server/routeDataHmr.js";
import babelServerModule from "../server/server-functions/babel.js";
import routeResource from "../server/serverResource.js";
globalThis.DEBUG = debug("start:vite");
let _dirname = dirname(fileURLToPath(import.meta.url));
// const _dirname = dirname(fileURLToPath(`${import.meta.url}`));

/**
 * @returns {import('node_modules/vite').PluginOption}
 * @param {any} options
 */
function solidStartInlineServerModules(options) {
  let lazy;
  let config;
  /** @type {import('node_modules/vite').Plugin} */
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
          const url = vite.resolvedUrls.local[0];
          // eslint-disable-next-line no-console
          console.log(`${label}\n   ${c.magenta(`${url}_m/*`)}\n`);
        }, 200);
      });
    }
  };
}

// import micromatch from "micromatch";
/**
 * @param {fs.PathLike} path
 */
function touch(path) {
  const time = new Date();
  try {
    fs.utimesSync(path, time, time);
  } catch (err) {
    fs.closeSync(fs.openSync(path, "w"));
  }
}
let i = 0;
/**
 * @param {any} arr
 */
function toArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  return [arr];
}

/**
 * @returns {import('node_modules/vite').Plugin}
 * @param {{ lazy?: any; restart?: any; reload?: any; ssr?: any; appRoot?: any; routesDir?: any; delay?: any; glob?: any; router?: any; }} options
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
          const url = vite.resolvedUrls.local[0];
          // eslint-disable-next-line no-console
          printUrls(router, url.substring(0, url.length - 1));
        }, 100);
      });
    },

    async transform(code, id, transformOptions) {
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
        return solid({
          ...(options ?? {}),
          ssr: process.env.START_SPA_CLIENT === "true" ? false : true,
          babel: babelOptions(fn)
        }).transform(code, id, transformOptions);
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
      } else if (code.includes("var routesConfig = $ROUTES_CONFIG;")) {
        return {
          code: code.replace(
            "var routesConfig = $ROUTES_CONFIG;",
            stringifyPageRoutes(router.getNestedPageRoutes(), {
              // if we are in SPA mode, and building the server bundle, we import
              // the routes eagerly so that they can dead-code eliminate properly,
              // for some reason, vite doesn't do it properly when the routes are
              // loaded lazily.
              lazy: ssr ? false : true
            })
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
 * @returns {import('node_modules/vite').Plugin}
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
 * @returns {import('node_modules/vite').Plugin}
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
    },
    transform(code, id) {
      if (module_style_pattern.test(id)) {
        env.cssModules[id] = code;
      }
    },
    configureServer(vite) {
      return async () => {
        const { createDevHandler } = await import("../dev/server.js");
        remove_html_middlewares(vite.middlewares);
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

/**
 * @returns {import('node_modules/vite').Plugin}
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
      // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
      options.env = await loadEnv(e.mode, process.cwd(), "");

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
          DEBUG: process.env.NODE_ENV === "production" ? "(() => {})" : "globalThis.DEBUG",
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
 * @param {string} locate
 * @param {string} [cwd]
 */
function find(locate, cwd) {
  cwd = cwd || process.cwd();
  if (cwd.split(path.sep).length < 2) return undefined;
  const match = fs.readdirSync(cwd).find(f => f === locate);
  if (match) return match;
  return find(locate, path.join(cwd, ".."));
}

const nodeModulesPath = find("node_modules");

function detectAdapter() {
  let adapters = [];
  fs.readdirSync(nodeModulesPath).forEach(dir => {
    if (dir.startsWith("solid-start-")) {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(nodeModulesPath, dir, "package.json"), {
          encoding: "utf8"
        })
      );
      if (pkg.solid && pkg.solid.type === "adapter") {
        adapters.push(dir);
      }
    }
  });

  // Ignore the default adapter.
  adapters = adapters.filter(adapter => adapter !== "solid-start-node");

  return adapters.length > 0 ? adapters[0] : "solid-start-node";
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
 * @returns {import('node_modules/vite').PluginOption[]}
 */
export default function solidStart(options) {
  options = Object.assign(
    {
      adapter: process.env.START_ADAPTER ? process.env.START_ADAPTER : detectAdapter(),
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
    options.inspect ? inspect({ outDir: join(".solid", "inspect") }) : undefined,
    options.ssr && solidStartInlineServerModules(options),
    solid({
      ...(options ?? {}),
      // if we are building the SPA client for production, we set ssr to false
      ssr: process.env.START_SPA_CLIENT === "true" ? false : true,
      babel: babelOptions(
        (/** @type {any} */ source, /** @type {any} */ id, /** @type {any} */ ssr) => ({
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
      )
    }),
    solidStartServer(options),
    solidsStartRouteManifest(options),
    options.islands ? islands() : undefined
  ].filter(Boolean);
}

function islands() {
  let mode;
  return {
    name: "solid-start-islands",
    config(c, m) {
      mode = m;
    },
    load(id) {
      if (id.includes("?island")) {
        let f = id.match(/isle_([A-Z0-9a-z_]+)&?\??$/);
        console.log("LOADING island", id);
        if (!f) {
          return {
            code: `
            import Component from '${id.replace("?island", "?client")}';

            window._$HY.island("${
              mode.command === "serve" ? `/@fs${id}` : `/${relative(process.cwd(), id)}`
            }", Component);

            export default Component;
            `
          };
        } else {
          return {
            code: `
            export { ${f[1]} } from '${id.replace(/\?.*/, "?client")}';
            import { ${f[1]} } from '${id.replace(/\?.*/, "?client")}';

            window._$HY.island("${
              mode.command === "serve" ? `/@fs${id}` : `/${relative(process.cwd(), id)}`
            }",  ${f[1]});

            `
          };
        }
      }
    },
    /**
     * @param {any} id
     * @param {string} code
     */
    transform(code, id, ssr) {
      if (code.startsWith('"use client"') && !id.includes("?client")) {
        let [imports, exports] = parse(
          esbuild.transformSync(code, {
            jsx: "transform",
            format: "esm",
            loader: "tsx"
          }).code
        );

        let prep = `
        import { unstable_island } from 'solid-start';

        `;

        let client = ``;

        console.log();
        exports.map(e => {
          if (e.n === "default") {
            prep += `
            import Island from '${id}?client';
            export default unstable_island(Island, "${
              mode.command === "serve" ? `@fs` + id + "?island" : null
            }");`;
            client += `
              export { default } from '${id}?island';
            `;
          } else {
            if (e.n.charAt(0) === e.n.charAt(0).toUpperCase()) {
              prep += `
              import {${e.ln} as ${e.ln}Island } from '${id}?client';
              export const ${e.ln} = unstable_island(${e.ln}Island, "${
                mode.command === "serve" ? `@fs` + id + `?island&isle_${e.ln}` : null
              }");`;
              client += `
              export { ${e.ln} } from '${id}?island&isle_${e.ln}';

              `;
            } else {
              prep += `
              export {${e.ln} } from '${id}?client';`;
              client += `
              export { ${e.ln} } from '${id}?client';
              `;
            }
          }
        });
        console.log(prep);
        return {
          code: ssr ? prep : client
        };
      }
      if (code.includes("unstable_island")) {
        let replaced = code.replaceAll(
          /const ([A-Za-z_]+) = unstable_island\(\(\) => import\("([^"]+)"\)\)/g,
          (a, b, c) =>
            ssr
              ? `import ${b}_island from "${c}?client"; 
                  const ${b} = unstable_island(${b}_island, "${
                  mode.command === "serve"
                    ? `@fs${join(dirname(id), c)}` + ".tsx" + "?island"
                    : `${relative(process.cwd(), join(dirname(id), c))}.tsx?island`
                }");`
              : `const ${b} = unstable_island(() => import("${c}?island"), "${
                  `@fs/${join(dirname(id), c).slice(1)}` + ".tsx" + "?island"
                }")`
        );

        return replaced;
      }
    }
  };
}

/**
 * @param {import('node_modules/vite').ViteDevServer['middlewares']} server
 */
function remove_html_middlewares(server) {
  const html_middlewares = [
    "viteIndexHtmlMiddleware",
    "vite404Middleware",
    "viteSpaFallbackMiddleware"
  ];
  for (let i = server.stack.length - 1; i > 0; i--) {
    // @ts-ignore
    if (html_middlewares.includes(server.stack[i].handle.name)) {
      server.stack.splice(i, 1);
    }
  }
}
