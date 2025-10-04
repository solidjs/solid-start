import { solidStart } from "@solidjs/start/config";
import { nitroV2Plugin } from "@solidjs/start/nitro-v2-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solidStart(), tailwindcss(), nitroV2Plugin()]
});
