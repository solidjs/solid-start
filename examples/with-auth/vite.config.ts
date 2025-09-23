import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solidStart({
      ssr: true, // false for client-side rendering only
      server: { preset: "" } // your deployment
    }),
    tailwindcss()
  ]
});
