import { defineConfig } from "vite";
import { solidStart } from "../../packages/start/src/config";
import { nitroV2Plugin } from "../../packages/start-nitro-v2-vite-plugin/src";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "solid-js/web": "@solidjs/web",
      "solid-js/store": "solid-js",
    },
    dedupe: ["solid-js", "@solidjs/web", "@solidjs/router", "@solidjs/signals", "@solidjs/meta"],
  },
  environments: {
    ssr: {
      resolve: {
        noExternal: ["@solidjs/web"],
      },
    },
  },
  plugins: [solidStart(), nitroV2Plugin()],
});
