import { defineConfig } from "vite";
import { nitroV2Plugin } from "../../packages/start-nitro-v2-vite-plugin/src";
import { solidStart } from "../../packages/start/src/config";

export default defineConfig({
  server: {
    port: 3000,
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
    nitroV2Plugin(),
  ],
});
