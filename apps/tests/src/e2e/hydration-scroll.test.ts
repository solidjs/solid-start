import { expect, test } from "@playwright/test";

const isHydrationMismatch = (text: string) =>
  text.includes("Hydration Mismatch") ||
  text.includes("Hydration mismatch") ||
  text.includes("Unable to find DOM nodes for hydration key");

test.describe("SSR Hydration Scroll Repro", () => {
  test("should not emit hydration mismatches on the first downward scroll", async ({ page }) => {
    const mismatchMessages: string[] = [];

    page.on("console", msg => {
      if (msg.type() === "error" || msg.type() === "warning") {
        const text = msg.text();
        if (isHydrationMismatch(text)) {
          mismatchMessages.push(text);
        }
      }
    });

    page.on("pageerror", error => {
      if (isHydrationMismatch(error.message)) {
        mismatchMessages.push(error.message);
      }
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/hydration-scroll-repro");

    await expect(page.getByTestId("hydration-scroll-trigger")).toBeVisible();
    await expect(page.getByTestId("hydration-scroll-chevron")).toBeVisible();

    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(250);

    expect(
      mismatchMessages,
      "Expected no hydration mismatch after the first downward scroll",
    ).toEqual([]);
  });
});
