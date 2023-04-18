import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import start from 'solid-start/astro';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
	integrations: [start({
		extensions: [".mdx", ".md"]
	})],
	vite: {
		plugins: [
			{...(await import("@mdx-js/rollup")).default({
				jsx: true,
				jsxImportSource: "solid-js",
				providerImportSource: "solid-mdx"
			}),
			enforce: "pre"}
		]
	}
});
