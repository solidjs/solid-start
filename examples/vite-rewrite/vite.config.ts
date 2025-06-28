import { defineConfig } from "vite";
import { solidStart } from "@solidjs/start-vite/config";

export default defineConfig({
  plugins: [solidStart()],
  build: {
    minify: false
  }
});
