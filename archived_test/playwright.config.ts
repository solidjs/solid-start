import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: ".",
  testMatch: ["**/*-test.ts"],
  timeout: 120_000,
  expect: {
    timeout: 5_000
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : undefined,
  reporter: process.env.CI
    ? "github"
    : [["html", { open: process.env.TEST_REPORT ? "always" : "none" }]],
  use: { actionTimeout: 0 },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ]
};

export default config;
