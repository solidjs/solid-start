import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/e2e",
  testMatch: "**/*.test.ts",

  webServer: {
    command: "pnpm run dev --host 127.0.0.1 --port 3000 --strictPort",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe",
  },

  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
