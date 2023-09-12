import mdx from "@mdx-js/rollup";
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  start: {
    extensions: ["mdx", "md"]
  },
  plugins: [
    {
      ...mdx({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx"
      }),
      enforce: "pre"
    }
  ]
});
