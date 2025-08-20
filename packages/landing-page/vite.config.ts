import { solidStart } from "@solidjs/start/config";
import { defineConfig } from "vite";

export default defineConfig({
  // experimental: { islands: true },
  plugins: [
    solidStart({
      server: {
        preset: "netlify"
      }
    })
  ]
});
