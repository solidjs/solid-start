import { defineConfig } from "@solidjs/start/config";
import solidStyled from 'vite-plugin-solid-styled';

export default defineConfig({
  plugins: [
    solidStyled({
      filter: {
        include: 'src/**/*.tsx',
        exclude: 'node_modules/**/*.{ts,js}',
      }
    }),
  ]
});
