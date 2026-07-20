import solid from "vite-plugin-solid";
import { configDefaults, defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [solid()],
  test: {
    mockReset: true,
    globals: true,
    exclude: [...configDefaults.exclude, "**/src/e2e/**"],
    projects: [
      {
        // 1. NODE Project (For fs, tree-shaking, server utilities)
        extends: true,
        test: {
          include: ["src/**/*.server.test.ts"],
          name: { label: "Node Logic", color: "green" },
          environment: "node",
        },
      },
      {
        // 2. BROWSER Project (For Solid components and DOM interaction)
        extends: true,
        test: {
          // Exclude the server files, include component/browser tests
          include: ["src/**/*.{test,spec}.tsx", "src/**/*.browser.test.ts"],
          name: { label: "Browser UI", color: "cyan" },
          // Browser configuration must live inside the project's 'test' key
          browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
