import path from "path";
import manifest from "rollup-route-manifest";
import solid from "vite-plugin-solid";
import fs from "fs";

const SOLID_START_DATA_MODULE_ID = "virtual:solid-start/data";
const SOLID_START_PAGES_MODULE_ID = "virtual:solid-start/pages";
const SOLID_START_ROUTES_MODULE_ID = "virtual:solid-start/routes";

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
      resolveId(id, referrer) {
        if (id === SOLID_START_DATA_MODULE_ID) {
          console.log(id);
          return id;
        } else if (id === SOLID_START_PAGES_MODULE_ID) {
          console.log(id);
          return id;
        } else if (id === SOLID_START_ROUTES_MODULE_ID) {
          console.log(id);
          return id;
        }
      },
      load(id) {
        if (id === SOLID_START_DATA_MODULE_ID) {
          console.log(id);
          return `export default import.meta.globEager("/src/pages/**/*.data.(js|ts)");`;
        } else if (id === SOLID_START_PAGES_MODULE_ID) {
          console.log(id);
          return `export default import.meta.glob("/src/pages/**/*.(${[
            "jsx",
            "tsx",
            ...options.extensions.map(e => (Array.isArray(e) ? e[0].slice(1) : e.slice(1)))
          ].join("|")})");`;
        } else if (id === SOLID_START_ROUTES_MODULE_ID) {
          console.log(id);
          return fs.readFileSync(
            path.dirname(new URL(import.meta.url).pathname) + "/routes.js",
            "utf8"
          );
        }
      },
      config(conf) {
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
                    file = file
                      .replace(path.join(root, "src"), "")
                      .replace(/(index)?\.[tj]sx?$/, "");
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
