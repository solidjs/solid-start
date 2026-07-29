import { test, expect } from "@playwright/test";

test.describe("SSR Hydration", () => {
  test("should render SSR content and hydrate successfully", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error" || msg.type() === "warning") {
        const text = msg.text();
        if (text.includes("Hydration mismatch") || text.includes("mismatch")) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto("/");

    const button = page.locator("#counter-button");
    const output = page.locator("#counter-output");

    await expect(output).toHaveText("0");

    // Retry until a click is handled post-hydration. Pre-hydration clicks are synchronous no-ops.
    await expect(async () => {
      await button.click();
      await expect(output).toHaveText("1", { timeout: 1000 });
    }).toPass({ timeout: 15000 });

    expect(consoleErrors, "Expected no hydration mismatch errors in console").toEqual([]);
  });
});
