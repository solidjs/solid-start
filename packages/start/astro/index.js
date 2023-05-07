import getPort, { portNumbers } from "get-port";
import solidStart from "../vite/plugin.js";
import build from "./builder.js";

export default function (solidOptions = {}) {
  let inline;
  let serverPath;
  const plugin = solidStart(solidOptions);
  return {
    name: "solid-start-astro",
    hooks: {
      "astro:config:setup": async ({ config, updateConfig, injectRoute, command }) => {
        const randomPort = await getPort({ port: portNumbers(3000, 52000) }) // Prefer 3000, but pick any port if not available
        process.env.PORT = process.env.PORT ?? (randomPort + '')
        inline = config.vite || {};
        injectRoute({
          entryPoint: new URL(command === "build" ? "./handler.js" : "./handler-dev.js", import.meta.url).pathname,
          pattern: "/[...all]"
        });
        updateConfig({
          server: {
            port: process.env.PORT,
          },
          vite: {
            plugins: [plugin],
          }
        });
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
