import solid from "solid-start/vite";
import icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    icons({
      compiler: "solid"
    }),
    solid({
      experimental: { islands: true, islandsRouter: true },
      // adapter: netlify({ edge: true }),
      ssr: true
    })
  ]
});
