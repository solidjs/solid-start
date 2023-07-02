import node from '@astrojs/node';
import mdx from "solid-start-mdx";
import { defineConfig } from 'astro/config';
import { resolve } from "path";
import start from 'solid-start/astro';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
  vite: {
    css: {
      postcss: {
        plugins: [(await import("tailwindcss")).default]
      }
    },
    optimizeDeps: {
      entries: []
    },
    plugins: [await mdx()],
  },
	integrations: [start({
    rootEntry: resolve("docs.root.tsx"),
    appRoot: "./docs",
    routesDir: ".",
    islandsRouter: true,
    islands: true,
    extensions: [".mdx", ".md"],
  })]
});
