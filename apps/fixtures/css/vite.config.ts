import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nitroV2Plugin } from "../../../packages/start-nitro-v2-vite-plugin/src";
import { solidStart } from "../../../packages/start/src/config";

export default defineConfig({
  plugins: [solidStart(), nitroV2Plugin(), tailwindcss()]
});
