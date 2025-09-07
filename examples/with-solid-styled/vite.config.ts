import solidStyled from "unplugin-solid-styled";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import { solidStart } from "../../packages/start/src/config";

export default defineConfig({
  plugins: [
    solidStart(),
    solidStyled.vite({
      filter: {
        include: "src/**/*.tsx",
        exclude: "node_modules/**/*.{ts,js}"
      }
    }) as PluginOption
  ]
});
