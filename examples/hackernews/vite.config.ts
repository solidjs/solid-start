import netlify from "solid-start-netlify";
import solid from "solid-start/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [
    solid({
      islands: true,
      islandsRouter: false,
      adapter: netlify({ edge: false })
    })
  ]
});
