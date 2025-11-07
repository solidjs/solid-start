import { defineConfig } from "vite";
import { solidStart } from "../../../packages/start/src/config";
import { nitroV2Plugin } from "../../../packages/start-nitro-v2-vite-plugin/src";

export default defineConfig({
  plugins: [solidStart(), nitroV2Plugin()]
});
