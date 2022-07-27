import solid from "solid-start";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      islands: true,
      islandsRouter: false
      //adapter: netlify({ edge: false })
    })
  ]
});
