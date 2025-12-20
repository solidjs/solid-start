import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nitroV2Plugin } from "../../../packages/start-nitro-v2-vite-plugin/src";
import { solidStart } from "../../../packages/start/src/config";

export default defineConfig({
  plugins: [solidStart(), nitroV2Plugin(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        /**
         * Creates a shared chunk with two components. Needed for the "SharedChunk" test!
         * The vite manifest behaves differently for such shared chunks.
         * More info: packages/start/src/config/lazy.ts
         *
         * TODO: When switching to Rolldown, migrate this to advancedChunks
         * https://vite.dev/guide/rolldown.html#manualchunks-to-advancedchunks
         */
        manualChunks(id) {
          if (!id.includes("src/components/sharedChunk")) return;
          return "shared";
        },
      },
    },
  },
});
