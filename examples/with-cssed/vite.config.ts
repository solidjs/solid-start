import cssedPlugin from "cssed/vite-plugin";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid(),
    cssedPlugin(),
  ],
});
