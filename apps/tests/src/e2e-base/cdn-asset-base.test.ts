import { expect, test } from "@playwright/test";

test.describe("app with a CDN asset base", () => {
  test("serves the page at the root and its entry script under the asset base", async ({
    page,
  }) => {
    const response = await page.goto("/");

    expect(response?.status()).toBe(200);
    await expect(page.locator('script[type="module"][src]').first()).toHaveAttribute(
      "src",
      /^\/some\/prefix\//,
    );
  });

  test("calls server functions at the root, not under the asset base", async ({ page }) => {
    const serverFunctionCalls: string[] = [];
    page.on("request", request => {
      if (request.url().includes("_server")) serverFunctionCalls.push(request.url());
    });

    await page.goto("/is-server-nested");

    await expect(page.locator("#server-fn-test")).toContainText('{"serverFnWithIsServer":true}');
    expect(serverFunctionCalls.length).toBeGreaterThan(0);
    for (const url of serverFunctionCalls) {
      expect(new URL(url).pathname).toMatch(/^\/_server/);
    }
  });

  test("matches API routes at the root", async () => {
    const response = await fetch("http://127.0.0.1:3001/api/text-plain");

    expect(await response.text()).toBe("test");
  });
});
