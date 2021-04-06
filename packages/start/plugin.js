import solid from "vite-plugin-solid";
import manifest from "rollup-route-manifest";
import path from "path";
import { fileURLToPath } from "url";

export default function StartPlugin(options) {
  options = Object.assign({ adapter: "solid-start-node", ssr: true, preferStreaming: true }, options)
  return [
    solid(options),
    {
      name: "solid-start",
      mode: "pre",
      config() {
        return {
          resolve: {
            conditions: ['solid'],
            alias: [{
              find: "~",
              replacement: path.join(process.cwd(), "src")
            }]
          },
          ssr: {
            noExternal: ["solid-app-router"]
          },
          solidOptions: options
        }
      }
    }, {
      name: "html-async",
      enforce: "post",
      transformIndexHtml(html) {
        return html.replace('type="module"', 'type="module" async');
      }
    }, manifest({
      inline: false,
      merge: false,
      publicPath: "/",
      routes: (file) => {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        file = file.replace(path.join(__dirname, "src"), "").replace(/\.[tj]sx?$/, "");
        if (!file.includes("/pages/")) return "*"; // commons
        return "/" + file.replace("/pages/", "").toLowerCase();
      }
    })
  ]
}