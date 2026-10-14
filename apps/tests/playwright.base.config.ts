import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/e2e-base",
  testMatch: "**/*.test.ts",

  webServer: {
    command: "pnpm run dev --config vite.config.base.ts --host 127.0.0.1 --port 3001 --strictPort",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe",
  },

  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
