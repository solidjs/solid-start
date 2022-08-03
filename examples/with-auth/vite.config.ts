import solid from "solid-start/vite";
import { defineConfig } from "vite";
import windicss from "vite-plugin-windicss";

export default defineConfig({
  plugins: [windicss(), solid()]
});
