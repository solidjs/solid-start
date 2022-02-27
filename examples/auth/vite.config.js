import { defineConfig } from "vite";
import solid from "solid-start";
import windicss from "vite-plugin-windicss";

export default defineConfig({
  plugins: [windicss(), solid()],
  test: {
    exclude: ["./e2e/**/*.spec.js", "node_modules"],
    environment: "jsdom"
  }
});
