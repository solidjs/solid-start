import { expect, test } from "@playwright/test";

// TODO: Re-enable when Solid 2 renders route content into the shell rather than
// a deferred chunk. Route content streams into a `<template>` that only the
// hydration script places in the DOM, so with JavaScript disabled the page body
// holds a placeholder and never the forms — every locator here times out. The
// server half already works: the action returns 303 back to the submitting page
// with the outcome in the flash cookie, and an SSR request carrying that cookie
// renders the expected result (verified by hand against the dev server).
test.describe.skip("actions without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("returning json() stays on the submitting page and keeps the result", async ({ page }) => {
    await page.goto("/no-js-action");
    await page.locator("#submit-json").click();

    await expect(page).toHaveURL(/\/no-js-action$/);
    await expect(page.locator("#json-result")).toHaveText('{"received":"from-json"}');
  });

  test("returning reload() stays on the submitting page", async ({ page }) => {
    await page.goto("/no-js-action");
    await page.locator("#submit-reload").click();

    await expect(page).toHaveURL(/\/no-js-action$/);
  });

  test("returning redirect() follows the given location", async ({ page }) => {
    await page.goto("/no-js-action");
    await page.locator("#submit-redirect").click();

    await expect(page).toHaveURL(/\/no-js-action\?redirected=1$/);
  });

  test("returning a plain value stays on the submitting page and keeps the result", async ({
    page,
  }) => {
    await page.goto("/no-js-action");
    await page.locator("#submit-plain").click();

    await expect(page).toHaveURL(/\/no-js-action$/);
    await expect(page.locator("#plain-result")).toHaveText('{"received":"from-plain"}');
  });
});
