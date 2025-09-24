import { defineConfig } from "@solidjs/start/config";
import solidPlugin from "vite-plugin-solid";
import UnoCSS from "unocss/vite";
import presetWind4 from "@unocss/preset-wind4";

export default defineConfig({
  vite: {
    plugins: [
      UnoCSS({
        presets: [presetWind4()]
      }),
      solidPlugin({
        ssr: true
      })
    ]
  }
});
