import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolveConfig } from "vite";
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
          plugins: solidStart(solidOptions)
        }});
      },
      "astro:build:setup": async ({ target, vite }) => {
        if (target === "client") vite.build.ssrManifest = true;
        // resolve it ourselves as Astro doesn't expose it
        config = await resolveConfig(vite, 'build', 'production', 'production');
      },
      "astro:build:done": async ({ dir }) => {
        let assetManifest = JSON.parse((await readFile(fileURLToPath(new URL('./manifest.json', dir)))).toString());
        let ssrManifest = JSON.parse((await readFile(fileURLToPath(new URL('./ssr-manifest.json', dir)))).toString());
        let routeManifest = prepareManifest(ssrManifest, assetManifest, config);
        const outFile = fileURLToPath(new URL('./route-manifest.json', dir));
        await writeFile(outFile, JSON.stringify(routeManifest, null, 2));
      }
    }
  };
}
