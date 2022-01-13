import path from "path";
import manifest from "rollup-route-manifest";
import solid from "vite-plugin-solid";
import fs from "fs";
import { getRoutes, stringifyRoutes } from "./routes.js";
export default function StartPlugin(options) {
  options = Object.assign(
    {
      adapter: "solid-start-node",
      ssr: true,
      preferStreaming: true,
      prerenderRoutes: []
    },
    options
  );

  return [
    solid(options),
    {
      name: "solid-start",
      mode: "pre",
      async load(id) {
        if (id.endsWith("components/Outlet.tsx")) {
          const routes = await getRoutes({
            pageExtensions: [
              "tsx",
              "jsx",
              "js",
              "ts",
              ...(options.extensions?.map(s => s.slice(1)) ?? [])
            ]
          });

          return fs
            .readFileSync(id, {
              encoding: "utf-8"
            })
            .replace("const routes = $ROUTES;", stringifyRoutes(routes));
        }
      },
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
          resolve: {
            conditions: ["solid"],
            alias: [
              {
                find: "~",
                replacement: path.join(root, "src")
              }
            ]
          },
          ssr: {
            noExternal: ["solid-app-router", "solid-meta", "solid-start"]
          },
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
                    file = file.replace(path.join(root, "src"), "").replace(regex, "");
                    if (!file.includes("/pages/")) return "*"; // commons
                    return "/" + file.replace("/pages/", "");
                  }
                })
              ]
            }
          },
          solidOptions: options
        };
      }
    }
  ];
}
