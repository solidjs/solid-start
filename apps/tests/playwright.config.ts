import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/e2e",
  testMatch: "**/*.test.ts",

  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe"
  },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry"
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
