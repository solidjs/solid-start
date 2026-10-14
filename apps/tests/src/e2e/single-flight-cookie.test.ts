import { expect, test } from "@playwright/test";

test.describe("single flight mutation", () => {
  test("should apply a cookie set by a thrown redirect to the same flight", async ({ page }) => {
    await page.goto("/single-flight-cookie");
    await expect(page.locator("#cookie-value")).toHaveText("none");

    await page.getByRole("button", { name: "set cookie" }).click();

    await expect(page.locator("#cookie-value")).toHaveText("1234");
  });
});
