import { test, expect } from "@playwright/test";

test("basic login test", async ({ browser }) => {
  let appURL = new URL(process.env.TEST_HOST ?? "http://localhost:3000/").href;
  const context = await browser.newContext({
    javaScriptEnabled: !process.env.DISABLE_JAVASCRIPT
  });

  const page = await context.newPage();

  // go to home
  await page.goto(appURL);
  expect(page.url()).toBe(appURL);
});
