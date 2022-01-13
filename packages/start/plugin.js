import path from "path";
import manifest from "rollup-route-manifest";
import solid from "vite-plugin-solid";
import fs from "fs";
import { getRoutes } from "./routes.js";
const SOLID_START_DATA_MODULE_ID = "virtual:solid-start/data";
const SOLID_START_PAGES_MODULE_ID = "virtual:solid-start/pages";
const SOLID_START_ROUTES_MODULE_ID = "virtual:solid-start/routes";
import fg from "fast-glob";
let server;
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
      configureServer: c => {
        server = c;
      },
      name: "solid-start",
      mode: "pre",
      resolveId(id, referrer) {
        // if (id === SOLID_START_DATA_MODULE_ID) {
        //   return id;
        // } else if (id === SOLID_START_PAGES_MODULE_ID) {
        //   return id;
        if (id === SOLID_START_ROUTES_MODULE_ID) {
          return id;
        }
      },
      async load(id) {
        // if (id === SOLID_START_DATA_MODULE_ID) {
        //   return `export default import.meta.globEager("/src/pages/**/*.data.(js|ts)");`;
        // } else if (id === SOLID_START_PAGES_MODULE_ID) {
        //   return `export default import.meta.glob("/src/pages/**/*.(${[
        //     "jsx",
        //     "tsx",
        //     ...(options?.extensions ?? []).map(e => (Array.isArray(e) ? e[0].slice(1) : e.slice(1)))
        //   ].join("|")})");`;
        if (id === SOLID_START_ROUTES_MODULE_ID) {
          const routes = await getRoutes();
          let imports = new Map();
          let vars = 0;
          function stringifyRoutes(r) {
            function addImport(p) {
              let d = "data" + vars++;
              imports.set(p, {
                default: d
              });
              return d;
            }

            return (
              `[\n` +
              r
                .map(
                  i =>
                    `{ ${[
                      i.dataSrc?.endsWith(".data.js")
                        ? `data: ${addImport(process.cwd() + "/" + i.dataSrc)}`
                        : undefined,
                      `component: lazy(() => import('${process.cwd() + "/" + i.componentSrc}'))`,
                      ...Object.keys(i)
                        .filter(k => i[k] !== undefined)
                        .map(
                          k =>
                            `${k}: ${
                              k === "children" ? stringifyRoutes(i[k]) : JSON.stringify(i[k])
                            }`
                        )
                    ]
                      .filter(Boolean)
                      .join(", ")} }`
                )
                // JSON.stringify({
                //   ...i,
                //   component: `() => import(${i.componentSrc})`,
                //   children: i.children ? stringifyRoutes(i.children) : undefined
                // })
                // )
                .join(",") +
              `\n]`
            );
          }

          let r = stringifyRoutes(routes.pageRoutes);
          console.log(
            [...imports.keys()].map(i => `import ${imports.get(i).default} from '${i}';`).join("\n")
          );
          return `
          import { lazy } from 'solid-js';
          ${[...imports.keys()]
            .map(i => `import ${imports.get(i).default} from '${i}';`)
            .join("\n")}
          export default ${r};`;
          // return fs
          //   .readFileSync(path.dirname(new URL(import.meta.url).pathname) + "/routes.js", "utf8")
          //   .replaceAll(
          //     "$EXTENSIONS",
          //     [
          //       ".jsx",
          //       ".tsx",
          //       ...(options?.extensions ?? []).map(e => (Array.isArray(e) ? e[0] : e))
          //     ].join("|")
          //   );
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
