import { test, expect } from "@playwright/test";

test.describe("route-groups", () => {
  test("should resolve `/routes/nested/(ignored)route0.tsx` to `nested/route0`", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/nested/route0");
    await expect(page.locator("body")).toContainText("nested route 0");
  });

  test("should resolve `/routes/nested/(level1)/(ignored)route1.tsx` to `nested/route1`", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/nested/route1");
    await expect(page.locator("body")).toContainText("nested route 1");
  });

  test("should resolve `/routes/nested/(level1)/(level2)/(ignored)route2.tsx` to `nested/route2`", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/nested/route2");
    await expect(page.locator("body")).toContainText("nested route 2");
  });

  test("should resolve `/routes/nested/(level1)/(level2)/route3.tsx` to `nested/route3`", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/nested/route3");
    await expect(page.locator("body")).toContainText("nested route 3");
  });
});
