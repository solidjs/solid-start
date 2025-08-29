import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  ssr: true, // false for client-side rendering only
  server: { preset: "" }, // your deployment
  vite: { plugins: [tailwindcss()] }
});
