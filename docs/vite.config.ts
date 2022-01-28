import { defineConfig } from "vite";
import solid from "solid-start";
import xdm from "xdm/rollup.js";
export default defineConfig({
  plugins: [
    {
      ...xdm({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx"
      }),
      enforce: "pre"
    },

    solid({
      extensions: [".mdx", ".md"],
      lazy: true
    })
  ]
});
