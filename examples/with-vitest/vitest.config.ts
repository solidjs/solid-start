import solid from "solid-start/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  test: {
    deps: {
      optimizer: {
        web: {
          include: ["/solid-js/"]
        }
      }
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ['node_modules/@testing-library/jest-dom/vitest', './setupVitest.js'],
    testTransformMode: { web: ["/\.[jt]sx?$/"] },
  },
  resolve: {
    conditions: ["development", "browser"],
  },
});
