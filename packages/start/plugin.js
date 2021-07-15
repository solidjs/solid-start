import path from "path";
import manifest from "rollup-route-manifest";
import solid from "vite-plugin-solid";

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
      config(conf) {
        return {
          resolve: {
            conditions: ["solid"],
            alias: [
              {
                find: "~",
                replacement: path.join(conf.root, "src")
              }
            ]
          },
          ssr: {
            noExternal: ["solid-app-router", "solid-meta", "solid-start"]
          },
          build: {
            rollupOptions: {
              plugins: [
                manifest({
                  inline: false,
                  merge: false,
                  publicPath: "/",
                  routes: file => {
                    file = file
                      .replace(path.join(conf.root, "src"), "")
                      .replace(/(index)?\.[tj]sx?$/, "");
                    if (!file.includes("/pages/")) return "*"; // commons
                    return "/" + file.replace("/pages/", "").toLowerCase();
                  }
                })
              ]
            }
          },
          solidOptions: options
        };
      }
    },
    options.preferStreaming && {
      name: "html-async",
      enforce: "post",
      transformIndexHtml(html) {
        return html.replace('type="module"', 'type="module" async');
      }
    }
  ];
}
