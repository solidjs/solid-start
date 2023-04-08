import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import prepareManifest from "../fs-router/manifest.js";
import solidStart from "../vite/plugin.js";

export default function(solidOptions = {}) {
  let config;
  return {
    name: "solid-start-astro",
    hooks: {
      "astro:config:setup": ({ updateConfig, injectRoute, addRenderer }) => {
        addRenderer({
          name: "@astrojs/solid-js",
          clientEntrypoint: "./src/entry-client.tsx",
          serverEntrypoint: "./src/entry-server.tsx"
        });
        injectRoute({
          entryPoint: new URL("./handler.js", new URL('.', import.meta.url)).pathname,
          pattern: "/[...all]"
        });
        updateConfig({ vite: {
          plugins: solidStart(solidOptions),
        }});
      },
      "astro:build:setup": ({ target, vite }) => {
        if (target === "client") vite.build.ssrManifest = true;
        config = vite;
      },
      "astro:build:done": async (props) => {
        const { dir } = props;
        let assetManifest = JSON.parse((await readFile(fileURLToPath(new URL('./manifest.json', dir)))).toString());
        let ssrManifest = JSON.parse((await readFile(fileURLToPath(new URL('./ssr-manifest.json', dir)))).toString());
        let routeManifest = prepareManifest(ssrManifest, assetManifest, config);
        console.log(routeManifest);
      }
    }
  };
}
