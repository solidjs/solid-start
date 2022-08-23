import { resolve } from "path";
import mdx from "solid-start-mdx";
import solid from "solid-start/vite";
import { defineConfig } from "vite";
export default defineConfig({
  optimizeDeps: {
    disabled: true
  },
  css: {
    postcss: {
      plugins: [(await import("tailwindcss")).default]
    }
  },
  plugins: [
    await mdx(),
    solid({
      rootEntry: resolve("root.docs.tsx"),
      appRoot: "./docs",
      routesDir: ".",
      islands: true,
      extensions: [".mdx", ".md"]
    })
  ]
});
