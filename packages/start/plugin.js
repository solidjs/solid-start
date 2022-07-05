import fs from "fs";
import path from "path";
import c from "picocolors";
import manifest from "rollup-route-manifest";
import { normalizePath } from "vite";
import inspect from "vite-plugin-inspect";
import solid from "vite-plugin-solid";
import { Router, stringifyApiRoutes, stringifyPageRoutes } from "./routes.js";
import routeData from "./server/routeData.js";
import routeDataHmr from "./server/routeDataHmr.js";
import babelServerModule from "./server/server-functions/babel.js";
import routeResource from "./server/serverResource.js";

/**
 * Helper function to get a human readable name for the given HTTP Verb
 * @param {string} verb
 * @returns {string} The uppercase and readable verb name
 */
function getHTTPVerbName(verb) {
  if (verb === "del") {
    return "DELETE";
  }
  return verb.toUpperCase();
}

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
        const protocol = config.server.https ? "https" : "http";
        const port = config.server.port;

        const label = `  > Server modules: `;
        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.log(`${label}${c.magenta(`${protocol}://localhost:${port}/_m/*`)}\n`);
        }, 200);
      });
    }
  };
}

// import micromatch from "micromatch";
function touch(path) {
  const time = new Date();
  try {
    fs.utimesSync(path, time, time);
  } catch (err) {
    fs.closeSync(fs.openSync(path, "w"));
  }
}
let i = 0;
function toArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  return [arr];
}

/**
 * @returns {import('vite').Plugin}
 */
function solidStartFileSystemRouter(options) {
  let lazy;
  let config;

  const { delay = 500, glob: enableGlob = true } = options;
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
  function schedule(fn) {
    clear();
    timer = setTimeout(fn, delay);
  }
  let router = new Router({
    pageExtensions: [
      "tsx",
      "jsx",
      "js",
      "ts",
      ...((options.extensions &&
        options.extensions.map(s => (Array.isArray(s) ? s[0] : s)).map(s => s.slice(1))) ||
        [])
    ]
  });
  let listener = function handleFileChange(file) {
    timerState = "restart";
    schedule(() => {
      if (router.watcher) {
        router.watcher.close();
      }
      touch(configFile);
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
  let server;
  return {
    name: "solid-start-file-system-router",
    enforce: "pre",
    config(c) {
      if (!enableGlob) return;
      if (!c.server) c.server = {};
      if (!c.server.watch) c.server.watch = {};
      c.server.watch.disableGlobbing = false;
    },
    async configResolved(_config) {
      lazy = _config.command !== "serve" || options.lazy === true;
      config = _config;
      await router.init();

      if (fs.existsSync("vite.config.ts")) configFile = "vite.config.ts";
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
        const protocol = config.server.https ? "https" : "http";
        const port = config.server.port;

        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.log(
            `${`  > Page Routes: `}\n${router
              .getFlattenedPageRoutes()
              .map(r => `     ${c.blue(`${protocol}://localhost:${port}${r.path}`)}`)
              .join("\n")}`
          );
          console.log("");
          console.log(
            `${`  > API Routes: `}\n${router
              .getFlattenedApiRoutes()
              .map(
                r =>
                  `     ${c.green(`${protocol}://localhost:${port}${r.path}`)} ${c.dim(
                    Object.keys(r.apiPath).map(getHTTPVerbName).join(" | ")
                  )}`
              )
              .join("\n")}`
          );
          console.log("");
        }, 100);
      });
    },

    async transform(code, id, transformOptions) {
      const isSsr =
        transformOptions === null || transformOptions === void 0 ? void 0 : transformOptions.ssr;

      let babelSolidCompiler = (code, id, fn) => {
        // @ts-ignore
        return solid({
          ...(options ?? {}),
          babel: fn
        }).transform(code, id, transformOptions);
      };

      let ssr = process.env.TEST_ENV === "client" ? false : isSsr;

      if (/\.test\.(tsx)/.test(id) && config.solidOptions.ssr) {
        return babelSolidCompiler(code, id, (source, id) => ({
          plugins: [
            options.ssr && [
              routeResource,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ],
            options.ssr && [
              babelServerModule,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ]
          ]
        }));
      }

      if (/\.data\.(ts|js)/.test(id) && config.solidOptions.ssr) {
        return babelSolidCompiler(code, id.replace(/\.data\.ts/, ".tsx"), (source, id) => ({
          plugins: [
            options.ssr && [
              routeResource,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ],
            options.ssr && [
              babelServerModule,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ]
          ]
        }));
      } else if (/\?data/.test(id)) {
        return babelSolidCompiler(code, id.replace("?data", ""), (source, id) => ({
          plugins: [
            options.ssr && [
              routeResource,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ],
            options.ssr && [
              babelServerModule,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ],
            [
              routeData,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ],
            !ssr &&
              process.env.NODE_ENV !== "production" && [routeDataHmr, { ssr, root: process.cwd() }]
          ].filter(Boolean)
        }));
      } else if (id.includes("routes")) {
        return babelSolidCompiler(code, id.replace("?data", ""), (source, id) => ({
          plugins: [
            options.ssr && [
              routeResource,
              {
                ssr,
                root: process.cwd(),
                keep: true,
                minify: process.env.NODE_ENV === "production"
              }
            ],
            options.ssr && [
              babelServerModule,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
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
      } else if (code.includes("server(")) {
        return babelSolidCompiler(
          code,
          id.replace(/\.ts$/, ".tsx").replace(/\.js$/, ".jsx"),
          (source, id) => ({
            plugins: [
              options.ssr && [
                babelServerModule,
                { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
              ]
            ].filter(Boolean)
          })
        );
      } else if (code.includes("var routes = $ROUTES;")) {
        return {
          code: code.replace(
            "var routes = $ROUTES;",
            stringifyPageRoutes(router.getNestedPageRoutes(), { lazy })
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

function solidsStartRouteManifest(options) {
  return {
    name: "solid-start-route-manifest",
    config(conf) {
      const regex = new RegExp(
        `(/index)?(.(${[
          "tsx",
          "ts",
          "jsx",
          "js",
          ...((options.extensions && options.extensions.map(e => e.slice(1))) || [])
        ].join("|")}))$`
      );

      const root = normalizePath(conf.root || process.cwd());
      return {
        build: {
          target: "esnext",
          manifest: true,
          rollupOptions: {
            plugins: [
              manifest({
                inline: false,
                merge: false,
                publicPath: "/",
                routes: file => {
                  file = file
                    .replace(path.posix.join(root, options.appRoot), "")
                    .replace(regex, (_, index) => (index ? "/" : ""));
                  if (!file.includes(`/${options.routesDir}/`)) return "*"; // commons
                  return "/" + file.replace(`/${options.routesDir}/`, "");
                }
              })
            ]
          }
        }
      };
    }
  };
}

/**
 * @returns {import('vite').Plugin}
 */
function solidStartSSR(options) {
  return {
    name: "solid-start-ssr",
    configureServer(vite) {
      return async () => {
        const { createDevHandler } = await import("./runtime/devServer.js");
        remove_html_middlewares(vite.middlewares);
        vite.middlewares.use(createDevHandler(vite));
      };
    }
  };
}

function solidStartConfig(options) {
  return {
    name: "solid-start-config",
    enforce: "pre",
    config(conf) {
      const root = conf.root || process.cwd();
      return {
        resolve: {
          conditions: ["solid"],
          alias: { "~": path.join(root, options.appRoot) }
        },
        ssr: {
          noExternal: ["solid-app-router", "solid-meta", "solid-start"]
        },
        define: {
          // handles use of process.env.TEST_ENV in solid-start internal code
          "process.env.TEST_ENV": JSON.stringify(process.env.TEST_ENV),
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
        },
        solidOptions: options
      };
    }
  };
}

function find(locate, cwd) {
  cwd = cwd || process.cwd();
  if (cwd.split(path.sep).length < 2) return undefined;
  const match = fs.readdirSync(cwd).find(f => f === locate);
  if (match) return match;
  return find(locate, path.join(cwd, ".."));
}

function detectAdapter() {
  const nodeModulesPath = find("node_modules");

  let adapters = [];
  fs.readdirSync(nodeModulesPath).forEach(dir => {
    if (dir.startsWith("solid-start-")) {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(nodeModulesPath, dir, "package.json"), { encoding: "utf8" })
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

/**
 * @returns {import('vite').Plugin[]}
 */
export default function solidStart(options) {
  options = Object.assign(
    {
      adapter: detectAdapter(),
      appRoot: "src",
      routesDir: "routes",
      ssr: true,
      prerenderRoutes: [],
      inspect: true
    },
    options ?? {}
  );

  // @ts-ignore
  return [
    // restart({
    //   restart: ["src/routes/**/*"]
    // }),
    solidStartConfig(options),
    solidStartFileSystemRouter(options),
    options.inspect ? inspect() : undefined,
    options.ssr && solidStartInlineServerModules(options),
    solid({
      ...(options ?? {}),
      babel: (source, id, ssr) => ({
        plugins: options.ssr
          ? [
              [
                routeResource,
                { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
              ],
              [
                babelServerModule,
                { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
              ]
            ]
          : []
      })
    }),
    options.ssr && solidStartSSR(options),
    solidsStartRouteManifest(options)
  ].filter(Boolean);
}

/**
 * @param {import('vite').ViteDevServer['middlewares']} server
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
