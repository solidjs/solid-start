import { resolve } from "path";
import mdx from "solid-start-mdx";
import solid from "solid-start/vite";
import { defineConfig } from "vite";
export default defineConfig({
  optimizeDeps: {
    disabled: true
  },
  plugins: [
    await mdx(),
    solid({
      rootEntry: resolve("root.docs.tsx"),
      appRoot: "./docs",
      routesDir: ".",
      extensions: [".mdx", ".md"]
    })
  ]
});
