import path from "path";
import manifest from "rollup-route-manifest";
import solid from "vite-plugin-solid";
import inspect from "vite-plugin-inspect";
import { getRoutes, stringifyRoutes } from "./routes.js";
import { createDevHandler } from "./runtime/devServer.js";
import c from "picocolors";
import babel from "@babel/core";
import compiledServer from "./compiled-server.js";

/**
 * @returns {import('vite').Plugin}
 */
function solidStartRouter(options) {
  return {
    name: "solid-start-router",
    enforce: "pre",

    async transform(code, id, opts) {
      if (/.data.(ts|js)/.test(id)) {
        return babel.transformSync(code, {
          filename: id,
          presets: ["@babel/preset-typescript"],
          plugins: [[compiledServer, { ssr: opts?.ssr ?? false }]]
        });
      }
      if (code.includes("const routes = $ROUTES;")) {
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

        return { code: code.replace("const routes = $ROUTES;", stringifyRoutes(routes)) };
      }
    }
  };
}

function solidStartBuild(options) {
  return {
    name: "solid-start-build",
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

      const root = conf.root || process.cwd();
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
                  file = file.replace(path.join(root, options.appRoot), "").replace(regex, "");
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
function solidStartServer(options) {
  let config;
  return {
    name: "solid-start-dev",
    configureServer(vite) {
      return () => {
        remove_html_middlewares(vite.middlewares);

        vite.middlewares.use("/__server", async (req, res) => {
          let data = "";
          req.on("data", chunk => {
            data += chunk;
          });
          req.on("end", async () => {
            let args = JSON.parse(data);
            let mod = await vite.ssrLoadModule(args.filename);
            try {
              let response = await mod["__serverModule" + args.index](...args.args);
              res.write(JSON.stringify(response));
              res.end();
            } catch (e) {
              res.write("Not found");
              res.statusCode = 500;
              res.end();
            }
          });
        });

        vite.middlewares.use(createDevHandler(vite));

        // logging routes on server start
        vite.httpServer?.once("listening", async () => {
          const protocol = config.server.https ? "https" : "http";
          const port = config.server.port;
          const routes = await getRoutes({
            pageExtensions: [
              "tsx",
              "jsx",
              "js",
              "ts",
              ...(options.extensions
                ?.map(s => (Array.isArray(s) ? s[0] : s))
                .map(s => s.slice(1)) ?? [])
            ]
          });
          const label = `  > Routes: `;
          setTimeout(() => {
            // eslint-disable-next-line no-console
            console.log(
              `${label}\n${routes.pageRoutes
                .flatMap(r => (r.children ? r.children : [r]))
                .map(r => `     ${c.blue(`${protocol}://localhost:${port}${r.path}`)}`)
                .join("\n")}`
            );
          }, 0);
        });
      };
    },
    configResolved: conf => {
      config = conf;
    },
    config(conf) {
      const root = conf.root || process.cwd();
      return {
        resolve: {
          conditions: ["solid"],
          alias: [
            {
              find: "~",
              replacement: path.join(root, options.appRoot)
            }
          ]
        },
        ssr: {
          noExternal: ["solid-app-router", "solid-meta", "solid-start"]
        },
        solidOptions: options
      };
    }
  };
}
import esbuild from "esbuild";

// function Babel() {
//   let config;
//   return {
//     name: "",
//     configResolved(conf) {
//       config = conf;
//     },
//     async transform(code, id, { ssr }) {
//       if (!ssr && code.includes("serverModule")) {
//         fs.mkdirSync(path.join(config.root, "node_modules", ".start"), { recursive: true });
//         fs.writeFileSync(path.join(config.root, "node_modules", ".start", "server.js"), code);
//         await esbuild.build({
//           entryPoints: [path.join(config.root, "node_modules", ".start", "server.js")],
//           outfile: path.join(config.root, "node_modules", ".start", "server.out.js"),
//           bundle: true,
//           external: ["*"],
//           format: "esm",
//           minify: true,
//           plugins: [
//             {
//               name: "env",
//               setup(build) {
//                 // Intercept import paths called "env" so esbuild doesn't attempt
//                 // to map them to a file system location. Tag them with the "env-ns"
//                 // namespace to reserve them for this plugin.
//                 build.onResolve(
//                   {
//                     filter: new RegExp(
//                       path.join(config.root, "node_modules", ".start", "server.js")
//                     )
//                   },
//                   args => ({
//                     path: args.path,
//                     external: false
//                   })
//                 );

//                 // Load paths tagged with the "env-ns" namespace and behave as if
//                 // they point to a JSON file containing the environment variables.
//                 // build.onLoad({ filter: /.*/, namespace: "env-ns" }, () => ({
//                 //   contents: JSON.stringify(process.env),
//                 //   loader: "json"
//                 // }));
//               }
//             }
//           ]
//         });

//         return {
//           code: fs.readFileSync(path.join(config.root, "node_modules", ".start", "server.out.js"), {
//             encoding: "utf-8"
//           })
//         };
//       }
//       return null;
//     }
//   };
// }

/**
 * @returns {import('vite').Plugin[]}
 */
export default function solidStart(options) {
  options = Object.assign(
    {
      adapter: "solid-start-node",
      appRoot: "src",
      routesDir: "pages",
      ssr: true,
      preferStreaming: true,
      prerenderRoutes: [],
      inspect: true
    },
    options ?? {}
  );

  return [
    options.inspect ? inspect() : undefined,
    solid({
      ...(options ?? {}),
      babel: (source, id, ssr) => ({
        plugins: [[compiledServer, { ssr }]]
      })
    }),
    solidStartRouter(options),
    solidStartServer(options),
    solidStartBuild(options)
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
    if (html_middlewares.includes(server.stack[i].handle.name)) {
      server.stack.splice(i, 1);
    }
  }
}
