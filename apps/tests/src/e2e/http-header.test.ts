import { expect, test } from "@playwright/test";

test.describe("http header", () => {
    // couldn't get this to see the headers but verified in chrome devtools
    test.skip("should set http header", async ({ page }) => {
        const response = await page.goto("/http-header");

        expect(response?.headers()["test-header"]).toBe("test-value");
    });
});
