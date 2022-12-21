import solid from "solid-start/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  test: {
    deps: {
      registerNodeLoader: true,
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ['node_modules/@testing-library/jest-dom/extend-expect'],
    transformMode: { web: [/\.[jt]sx?$/] },
  },
});
