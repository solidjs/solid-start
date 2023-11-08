import { defineConfig } from "@solidjs/start/config";
import pkg from "@vinxi/plugin-mdx";

const { default: mdx } = pkg;
export default defineConfig({
  optimizeDeps: {
    entries: []
  },
  start: {
    appRoot: "./docs",
    extensions: ["mdx", "md"]
  },
  plugins: [
    mdx.withImports({})({
      jsx: true,
      jsxImportSource: "solid-js",
      providerImportSource: "solid-mdx"
    })
  ]
});