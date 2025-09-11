import { defineConfig } from "vite";
/* @ts-ignore */
import pkg from "@vinxi/plugin-mdx";
import { solidStart } from "../../packages/start/src/config";

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
