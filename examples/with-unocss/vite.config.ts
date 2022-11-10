import solid from "solid-start/vite";
import presetUno from "unocss/preset-uno";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solid(), unocss({ presets: [presetUno()] })]
});
