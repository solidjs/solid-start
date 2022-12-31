import solid from "solid-start/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  test: {
    deps: {
      registerNodeLoader: true,
      inline: [/solid-js/],
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ['node_modules/@testing-library/jest-dom/extend-expect', './setupVitest.js'],
    transformMode: { web: [/\.[jt]sx?$/] },
  },
  resolve: {
    conditions: ["development", "browser"],
  },
});
