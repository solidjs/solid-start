import { defineConfig } from "vite";
import solid from "solid-start";
import xdm from "xdm/rollup.js";
import UnoCSSVite from "unocss/vite";

export default defineConfig({
  plugins: [
    // {
    //   ...xdm({
    //     jsx: true,
    //     jsxImportSource: "solid-js",
    //     providerImportSource: "solid-mdx"
    //   }),
    //   enforce: "pre"
    // },
    UnoCSSVite({}),
    solid({
      // extensions: [".mdx", ".md"],
    })
  ]
});
 