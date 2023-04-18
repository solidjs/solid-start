import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import start from 'solid-start/astro';
import solidStyled from 'vite-plugin-solid-styled';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
	integrations: [start()],
	vite: {
		plugins: [solidStyled({
      filter: {
        include: 'src/**/*.tsx',
        exclude: 'node_modules/**/*.{ts,js}',
      }
    })]
	}
});
