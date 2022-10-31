import { resolve } from "path";
import worker from "solid-start-cloudflare-workers";
import mdx from "solid-start-mdx";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: {
      plugins: [(await import("tailwindcss")).default]
    }
  },
  optimizeDeps: {
    entries: []
  },
  plugins: [
    await mdx(),
    solid({
      rootEntry: resolve("docs.root.tsx"),
      appRoot: "./docs",
      routesDir: ".",
      islandsRouter: true,
      islands: true,
      extensions: [".mdx", ".md"],
      adapter: worker({})
    })
  ]
});
