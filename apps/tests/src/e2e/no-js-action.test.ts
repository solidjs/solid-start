import { expect, test } from "@playwright/test";

test.describe("actions without JavaScript", () => {
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
