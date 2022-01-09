import { defineConfig } from "vite";
import solid from "solid-start";
import inspect from "vite-plugin-inspect";

export default defineConfig({
  plugins: [solid(), inspect()]
});
