import { defineConfig } from "vite";
import solid from "solid-start";
import mdx from "@mdx-js/rollup";
import WindiCSS from "vite-plugin-windicss"

export default defineConfig({
  plugins: [
    {
      ...mdx({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx"
      }),
      enforce: "pre"
    },
    WindiCSS(),
    solid({
      extensions: [".mdx", ".md"],
    })
  ]
});
 