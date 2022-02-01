import { defineConfig } from "vite";
import solid from "solid-start";
import xdm from "xdm/rollup.js";
import UnoCSSVite from "unocss/vite";
import rehypeHighlight from "rehype-highlight";

export default defineConfig({
  plugins: [
    {
      ...xdm({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx",
        rehypePlugins: [rehypeHighlight],
        
      }),
      enforce: "pre"
    },
    UnoCSSVite({}),
    solid({
      extensions: [".mdx", ".md"],
    })
  ]
});
 