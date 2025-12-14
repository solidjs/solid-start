import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  plugins: [solid()],
  test: {
    mockReset: true,
    globals: true,
    exclude: ["**/src/e2e/**"], // we need this to offload these to playwright, for e2e tests
    projects: [
      {
        // 1. NODE Project (For fs, tree-shaking, server utilities)
        extends: true,
        test: {
          include: ["**/*.server.test.ts"], // Matches the tree-shaking test
          name: { label: "Node Logic", color: "green" },
          environment: "node",
        },
      },
      {
        // 2. BROWSER Project (For Solid components and DOM interaction)
        extends: true,
        test: {
          // Exclude the server files, include component/browser tests
          include: ["**/*.{test,spec}.tsx", "**/*.browser.test.ts"],
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
