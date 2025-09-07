import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";
import { solidStart } from "../../packages/start/src/config";

export default defineConfig({
  plugins: [UnoCSS(), solidStart()]
});
