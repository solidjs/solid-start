import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nitroV2Plugin } from "../../../packages/start-nitro-v2-vite-plugin/src";
import { solidStart } from "../../../packages/start/src/config";
import virtualCSS from "./src/virtualCssPlugin";

export default defineConfig({
  plugins: [virtualCSS(), solidStart(), nitroV2Plugin(), tailwindcss()],
});
