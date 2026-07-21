import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { solidStart } from "../../packages/start/src/config";

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
  plugins: [
    solidStart({
      env: {
        server: {
          load() {
            return {
              SERVER_EXAMPLE: "This is a server example.",
            };
          },
        },
        client: {
          load() {
            return {
              CLIENT_EXAMPLE: "This is a client example.",
            };
          },
        },
      },
    }),
    nitro({
      compressPublicAssets: true,
    }),
  ],
});
