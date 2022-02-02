import { defineConfig } from "vite";
import solid from "solid-start";
import mdx from "@mdx-js/rollup";
import WindiCSS from "vite-plugin-windicss";

import rehypeHighlight from "rehype-highlight";

export default defineConfig({
  plugins: [
    {
      ...mdx({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx",
        rehypePlugins: [rehypeHighlight],
      }),
      enforce: "pre"
    },
    WindiCSS(),
    solid({
      extensions: [".mdx", ".md"],
    })
  ]
});
 