import { solidStart } from "@solidjs/start/config";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [UnoCSS(), solidStart()]
});
