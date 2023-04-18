import solidStart from "../vite/plugin.js";
import build from "./builder.js";

export default function(solidOptions = {}) {
  let inline;
  let serverPath;
  const plugin = solidStart(solidOptions);
  return {
    name: "solid-start-astro",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectRoute, command }) => {
        inline = config.vite || {};
        injectRoute({
          entryPoint: new URL(command === "build" ? "./handler.js" : "./handler-dev.js", import.meta.url).pathname,
          pattern: "/[...all]"
        });
        updateConfig({ vite: {
          plugins: [plugin]
        }});
      },
      "astro:config:done": ({ config }) => {
        serverPath = config.build.server.pathname;
      },
      "astro:build:setup": ({ vite }) => {
        // Silence warning atleast during build
        vite.plugins = vite.plugins.filter(p => p.name !== "astro:jsx")
      },
      "astro:build:done": async ({ dir }) => {
        inline.plugins || (inline.plugins = []);
        inline.plugins.push(plugin);
        await build(dir.pathname, serverPath, inline);
      }
    }
  };
}
