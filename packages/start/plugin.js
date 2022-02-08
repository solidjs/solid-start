import path from "path";
import { normalizePath } from "vite";
import manifest from "rollup-route-manifest";
import solid from "vite-plugin-solid";
import inspect from "vite-plugin-inspect";
import { getRoutes, stringifyRoutes } from "./routes.js";
import { createDevHandler } from "./runtime/devServer.js";
import c from "picocolors";
import babel from "@babel/core";
import babelServerModule from "./server/babel.js";
import { join, resolve } from "path";
import vite from "vite";
import connect from "connect";
import http from "http";
import compression from "compression";
import sirv from "sirv";
import routeData from "./server/routeData.js";

function solidStartClientAdpater() {
  return {
    async start(config) {
      var app = connect();
      app.use(compression());
      app.use(config.base, sirv(join(config.root, "dist")));
      http.createServer(app).listen(3000);
      console.log("Listening on http://localhost:3000");
      return;
    },
    async build(config) {
      await vite.build({
        root: join(config.root),
        // out: "./dist/",
        build: {
          outDir: "./dist/",
          rollupOptions: {
            input: resolve(join(config.root, "index.html")),
            output: {
              manualChunks: undefined
            }
          },
          minify: "terser"
        }
      });
    }
  };
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
      vite.httpServer?.once("listening", async () => {
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

/**
 * @returns {import('vite').Plugin}
 */
function solidStartFileSystemRouter(options) {
  let lazy;
  let config;
  /** @type {import('vite').Plugin} */
  return {
    name: "solid-start-file-system-router",
    enforce: "pre",
    configResolved(_config) {
      lazy = _config.command !== "serve";
      config = _config;
    },
    configureServer(vite) {
      vite.httpServer?.once("listening", async () => {
        const protocol = config.server.https ? "https" : "http";
        const port = config.server.port;
        const routes = await getRoutes({
          pageExtensions: [
            "tsx",
            "jsx",
            "js",
            "ts",
            ...(options.extensions?.map(s => (Array.isArray(s) ? s[0] : s)).map(s => s.slice(1)) ??
              [])
          ]
        });
        const label = `  > Routes: `;

        let flatRoutes = [];

        function addRoute(route) {
          if (route.children) {
            for (var r of route.children) {
              addRoute(r);
            }
          }

          flatRoutes.push(route);
        }

        for (var r of routes.pageRoutes) {
          addRoute(r);
        }
        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.log(
            `${label}\n${flatRoutes
              .map(r => `     ${c.blue(`${protocol}://localhost:${port}${r.path}`)}`)
              .join("\n")}`
          );
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

      if (/.test.(tsx)/.test(id) && config.solidOptions.ssr) {
        return babelSolidCompiler(code, id, (source, id) => ({
          plugins: [
            options.ssr && [
              babelServerModule,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ]
          ]
        }));
      }

      if (/.data.(ts|js)/.test(id) && config.solidOptions.ssr) {
        return babelSolidCompiler(code, id.replace(/.data.ts/, ".tsx"), (source, id) => ({
          plugins: [
            options.ssr && [
              babelServerModule,
              { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ]
          ]
        }));
      } else if (/\?data/.test(id)) {
        const text = await babelSolidCompiler(code, id.replace("?data", ""), (source, id) => ({
          plugins: [
            [
              babelServerModule,
              { ssr: isSsr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }
            ],
            [routeData, { ssr, root: process.cwd(), minify: process.env.NODE_ENV === "production" }]
          ].filter(Boolean)
        }));
        return text;
      } else if (id.includes("routes")) {
        return babelSolidCompiler(code, id.replace("?data", ""), (source, id) => ({
          plugins: [
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
      } else if (code.includes("const routes = $ROUTES;")) {
        const routes = await getRoutes({
          pageExtensions: [
            "tsx",
            "jsx",
            "js",
            "ts",
            ...(options.extensions?.map(s => (Array.isArray(s) ? s[0] : s)).map(s => s.slice(1)) ??
              [])
          ]
        });

        return { code: code.replace("const routes = $ROUTES;", stringifyRoutes(routes, { lazy })) };
      }
    }
  };
}

function solidsStartRouteManifest(options) {
  return {
    name: "solid-start-route-manifest",
    config(conf) {
      const regex = new RegExp(
        `(index)?(.(${[
          "tsx",
          "ts",
          "jsx",
          "js",
          ...(options.extensions?.map(e => e.slice(1)) ?? [])
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
                    .replace(regex, "");
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
      return () => {
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
        solidOptions: options
      };
    }
  };
}

/**
 * @returns {import('vite').Plugin[]}
 */
export default function solidStart(options) {
  options = Object.assign(
    {
      adapter:
        options && options.ssr !== undefined && !options.srr
          ? solidStartClientAdpater()
          : "solid-start-node",
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
