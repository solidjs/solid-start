import { solidStart } from "@solidjs/start/config";
import { defineConfig } from "vite";
/* @ts-ignore */
import pkg from "@vinxi/plugin-mdx";

const { default: mdx } = pkg;
export default defineConfig({
  plugins: [
    mdx.withImports({})({
      jsx: true,
      jsxImportSource: "solid-js",
      providerImportSource: "solid-mdx"
    }),
    solidStart({
      extensions: ["mdx", "md"],
    }),
  ]
});
