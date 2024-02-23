import { defineConfig } from "@solidjs/start/config";
import type { PluginOption } from "vite";
import solidStyled from "vite-plugin-solid-styled";

export default defineConfig({
  vite: {
    plugins: [
      solidStyled({
        filter: {
          include: "src/**/*.tsx",
          exclude: "node_modules/**/*.{ts,js}"
        }
      }) as PluginOption
    ]
  }
});
