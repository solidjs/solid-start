import { defineConfig } from "vite";
import { solidStart } from "@solidjs/start/config";
import { nitroV2Plugin } from "@solidjs/vite-plugin-nitro-2";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [solidStart(), nitroV2Plugin()],
});
