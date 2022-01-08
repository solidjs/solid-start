import { defineConfig } from "vite";
import solid from "solid-start";
import inspect from "vite-plugin-inspect";

export default defineConfig({
  plugins: [
    {
      ...(await import("@mdx-js/rollup")).default({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx"
      }),
      enforce: "pre"
    },
    solid({
      extensions: [".mdx"]
    }),
    inspect()
  ]
});
