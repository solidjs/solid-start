import solid from "solid-start";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    solid({
      adapter: process.env.ADAPTER
    })
  ]
});
