import solidStart from "../vite/plugin.js";
import build from "./builder.js";

export default function(solidOptions = {}) {
  let inline;
  const plugin = solidStart(solidOptions);
  return {
    name: "solid-start-astro",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, injectRoute, command }) => {
        inline = config.vite || {};
        injectRoute({
          entryPoint: new URL(command === "build" ? "./handler.js" : "./handler-dev.js", new URL('.', import.meta.url)).pathname,
          pattern: "/[...all]"
        });
        updateConfig({ vite: {
          plugins: [plugin]
        }});
      },
      "astro:build:done": async ({ dir }) => {
        inline.plugins || (inline.plugins = []);
        inline.plugins.push(plugin);
        await build(dir.pathname, inline);
      }
    }
  };
}
