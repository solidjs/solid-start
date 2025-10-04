import { solidStart } from "@solidjs/start/config";
import { nitroV2Plugin } from "@solidjs/start/nitro-v2-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solidStart({
      middleware: "src/middleware.ts"
    }),
    nitroV2Plugin()
  ]
});
