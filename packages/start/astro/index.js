import getPort, { portNumbers } from "get-port";
import { fileURLToPath } from "node:url";
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
        const randomPort = await getPort({ port: portNumbers(3000, 52000) }); // Prefer 3000, but pick any port if not available
        process.env.PORT = process.env.PORT ?? randomPort + "";
        inline = config.vite || {};
        injectRoute({
          entryPoint: new URL(
            command === "build" ? "./handler.js" : "./handler-dev.js",
            import.meta.url
          ).pathname,
          pattern: "/[...all]"
        });
        updateConfig({
          server: {
            port: process.env.PORT
          },
          vite: {
            plugins: [shutupJSX, plugin]
          }
        });
      },
      "astro:config:done": ({ config }) => {
        serverPath = fileURLToPath(new URL(config.build.server));
      },
      "astro:build:done": async ({ dir }) => {
        inline.plugins || (inline.plugins = []);
        inline.plugins.push(plugin);
        const path = fileURLToPath(new URL(dir));
        await build(path, serverPath, inline);
      }
    }
  };
}

const shutupJSX = {
  name: "shutup:jsx",
  enforce: "pre",
  configResolved(c) {
    // remove standard astro jsx plugin
    // TODO: remove this when we figure out how to play nice with others
    const astro = c.plugins.findIndex(p => p.name === "astro:jsx");
    if (astro !== -1) c.plugins.splice(astro, 1);
  }
};
