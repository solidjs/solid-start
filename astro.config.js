import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import { resolve } from "path";
import mdx from "solid-start-mdx";
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
    plugins: [
      await mdx(), 
      {
        name: "remove:astro:markdown",
        enforce: "pre",
        configResolved(c) {
          const astro = c.plugins.findIndex(p => p.name === "astro:markdown");
          if (astro !== -1) c.plugins.splice(astro, 1);
        }
      }
    ],
  },
	integrations: [start({
    rootEntry: resolve("docs.root.tsx"),
    routesDir: "../docs",
    islandsRouter: true,
    islands: true,
    extensions: [".mdx", ".md"],
  })]
});
