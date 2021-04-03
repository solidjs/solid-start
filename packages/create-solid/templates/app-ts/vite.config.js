import { defineConfig } from "vite";
import solid from "solid-start";

export default defineConfig({
  plugins: [
    solid({ ssr: true }),
  ],
  build: {
    polyfillDynamicImport: false,
    target: "esnext"
  }
});
