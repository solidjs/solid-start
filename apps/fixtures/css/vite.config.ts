import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { solidStart } from "../../../packages/start/src/config";
import virtualCSS from "./src/virtualCssPlugin";

export default defineConfig({
  plugins: [virtualCSS(), solidStart(), nitro(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        /**
         * Creates a shared chunk with two components. Needed for the "SharedChunk" test!
         * The vite manifest behaves differently for such shared chunks.
         * More info: packages/start/src/config/lazy.ts
         */
        codeSplitting: {
          groups: [
            {
              name: "shared-css",
              test: "src/components/sharedChunk",
            },
          ],
        },
      },
    },
  },
});
