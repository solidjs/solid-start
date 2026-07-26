import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { solidStart } from "../../packages/start/src/config";

export default defineConfig({
  plugins: [
    tailwindcss(),
    solidStart(),
    nitro({
      preset: "netlify",
      exportConditions: ["module"],
    }),
  ],
});
