import { expect, test } from "@playwright/test";

test("does not retain the current route when going back after reloads", async ({ page }) => {
  await page.goto("/suspense-back");
  await expect(page.getByRole("heading", { name: "root video" })).toBeVisible();

  await page.getByRole("link", { name: /root video/ }).click();
  await expect(page.getByText("detail video")).toBeVisible();

  await page.reload();
  await expect(page.getByText("detail video")).toBeVisible();
  await page.reload();
  await expect(page.getByText("detail video")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/suspense-back$/);
  await expect(page.getByRole("heading", { name: "root video" })).toBeVisible();
  await expect(page.getByText("detail video")).toHaveCount(0);
  await expect(page.getByAltText("root video")).toHaveCount(1);
});
