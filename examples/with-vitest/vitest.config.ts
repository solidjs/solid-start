import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  test: {
    deps: {
      optimizer: {
        web: {
          enabled: true
        }
      }
    },
    environment: "jsdom",
    globals: true,
    setupFiles: ['./setupVitest.ts'],
    testTransformMode: { web: ["/\.[jt]sx?$/"] },
  },
  resolve: {
    conditions: ["development", "browser"],
  },
});
