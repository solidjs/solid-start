import { expect, test } from "@playwright/test";

// These use their own routes rather than /client-only: in bundled dev mode, a
// visit to /client-only changes how its route module is loaded afterwards,
// which hydration-navigation.test.ts relies on.
test.describe("clientOnly", () => {
  test("renders a default export only on the client", async ({ page, request }) => {
    const html = await (await request.get("/client-only/default")).text();
    expect(html).toContain("CLIENT_ONLY_FALLBACK");
    expect(html).not.toContain("CLIENT_ONLY_DEFAULT_EXPORT_RENDERED");

    await page.goto("/client-only/default");
    await expect(page.locator("#client-only-default")).toHaveText(
      "CLIENT_ONLY_DEFAULT_EXPORT_RENDERED",
    );
    await expect(page.locator("#client-only-fallback")).toHaveCount(0);
  });

  test("renders a named export when the loader resolves to the component", async ({
    page,
    request,
  }) => {
    const html = await (await request.get("/client-only/named")).text();
    expect(html).toContain("CLIENT_ONLY_FALLBACK");
    expect(html).not.toContain("CLIENT_ONLY_NAMED_EXPORT_RENDERED");

    await page.goto("/client-only/named");
    await expect(page.locator("#client-only-named")).toHaveText(
      "CLIENT_ONLY_NAMED_EXPORT_RENDERED",
    );
    await expect(page.locator("#client-only-fallback")).toHaveCount(0);
  });
});
