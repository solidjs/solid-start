import { expect, test } from "@playwright/test";

test.describe("clientOnly", () => {
  test("renders a default export only on the client", async ({ page, request }) => {
    const html = await (await request.get("/client-only")).text();
    expect(html).not.toContain("clientWithIsServer");

    await page.goto("/client-only");
    await expect(page.locator("#server-fn-test")).toHaveText('{"clientWithIsServer":false}');
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
