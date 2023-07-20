import getPort, { portNumbers } from "get-port";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import solidStart from "../vite/plugin.js";
import build from "./builder.js";

export default function (solidOptions = {}) {
  let inline;
  let serverPath;
  let clientPath;
  const plugin = solidStart(solidOptions);
  return {
    name: "solid-start-astro",
    hooks: {
      "astro:config:setup": async ({ config, updateConfig, injectRoute, command }) => {
        const randomPort = await getPort({ port: portNumbers(3000, 52000) }); // Prefer 3000, but pick any port if not available
        process.env.PORT = process.env.PORT ?? config.server?.port ?? randomPort + "";
        inline = config.vite || {};
        clientPath = fileURLToPath(config.build.client);
        injectRoute({
          entryPoint: new URL(
            command === "build" ? "./handler.js" : "./handler-dev.js",
            import.meta.url
          ).pathname,
          pattern: "/[...all]"
        });
        updateConfig({
          build: {
            client: new URL('.solid/astro-client', config.root)
          },
          server: {
            port: process.env.PORT
          },
          vite: {
            plugins: [shutupJSX, plugin]
          }
        });
      },
      "astro:config:done": ({ config }) => {
        serverPath = fileURLToPath(config.build.server);
      },
      "astro:build:done": async ({ dir }) => {
        rmSync(fileURLToPath(dir), { recursive: true, force: true })
        inline.plugins || (inline.plugins = []);
        inline.plugins.push(plugin);
        await build(clientPath, serverPath, inline);
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
