import { solidStart } from "@solidjs/start/config";
import { nitroV2Plugin } from "@solidjs/start/nitro-v2-plugin";
import solidStyled from "unplugin-solid-styled";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solidStart(),
    solidStyled.vite({
      filter: {
        include: "src/**/*.tsx",
        exclude: "node_modules/**/*.{ts,js}"
      }
    }) as PluginOption,
    nitroV2Plugin()
  ]
});
