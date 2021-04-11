import { defineConfig } from "vite";
import solid from "solid-start";

export default defineConfig({
  plugins: [solid()],
  build: {
    polyfillDynamicImport: false,
    target: "esnext"
  }
});
