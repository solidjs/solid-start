import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      babel: (_, id) => ({
        plugins: [["solid-styled", { source: id }]]
      })
    })
  ]
});
