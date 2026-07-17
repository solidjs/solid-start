import { expect, test } from "@playwright/test";

test.describe("server-function", () => {
  test("should have isServer true in the server function - nested", async ({ page }) => {
    await page.goto("http://localhost:3000/is-server-nested");
    await expect(page.locator("#server-fn-test")).toContainText('{"serverFnWithIsServer":true}');
  });

  test("should have isServer true in the server function - const", async ({ page }) => {
    await page.goto("http://localhost:3000/is-server-const");
    await expect(page.locator("#server-fn-test")).toContainText('{"serverFnWithIsServer":true}');
  });

  test("should have an id of type string in the server function meta - nested", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/server-function-meta-nested");
    await expect(page.locator("#server-fn-test")).toContainText('{"serverFnWithMeta":"string"}');
  });

  test("should externalize node builtin in server function - nested", async ({ page }) => {
    await page.goto("http://localhost:3000/node-builtin-nested");
    await expect(page.locator("#server-fn-test")).toContainText(
      '{"serverFnWithNodeBuiltin":"can/externalize"}',
    );
  });

  test("should externalize npm module in server function - nested", async ({ page }) => {
    await page.goto("http://localhost:3000/npm-module-nested");
    await expect(page.locator("#server-fn-test")).toContainText(
      '{"serverFnWithNpmModule":[2,4,6]}',
    );
  });

  test("should have isServer true in the server function - toplevel", async ({ page }) => {
    await page.goto("http://localhost:3000/is-server-toplevel");
    await expect(page.locator("#server-fn-test")).toContainText('{"serverFnWithIsServer":true}');
  });

  test("should have an id of type string in the server function meta - toplevel", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/server-function-meta");
    await expect(page.locator("#server-fn-test")).toContainText('{"serverFnWithMeta":"string"}');
  });

  test("should externalize node builtin in server function - toplevel", async ({ page }) => {
    await page.goto("http://localhost:3000/node-builtin-toplevel");
    await expect(page.locator("#server-fn-test")).toContainText(
      '{"serverFnWithNodeBuiltin":"can/externalize"}',
    );
  });

  test("should externalize npm module in server function - toplevel", async ({ page }) => {
    await page.goto("http://localhost:3000/npm-module-toplevel");
    await expect(page.locator("#server-fn-test")).toContainText(
      '{"serverFnWithNpmModule":[2,4,6]}',
    );
  });

  test("should build when anon default export and server functions", async ({ page }) => {
    await page.goto("http://localhost:3000/is-server-with-anon-default-export");
    await expect(page.locator("#server-fn-test")).toContainText('{"serverFnWithIsServer":true}');
  });

  test("should build with generator as server function", async ({ page }) => {
    await page.goto("http://localhost:3000/generator-server-function");
    await expect(page.locator("#server-fn-test")).toContainText("¡Hola, Mundo!");
  });

  test("should build with a server function ping", async ({ page }) => {
    await page.goto("http://localhost:3000/server-function-ping");
    await expect(page.locator("#server-fn-test")).toContainText('{"result":true}');
  });

  test("should build with a server function w/ form data", async ({ page }) => {
    await page.goto("http://localhost:3000/server-function-form-data");
    await expect(page.locator("#server-fn-test")).toContainText('{"result":true}');
  });
  test("should build with a server function w/ blob data", async ({ page }) => {
    await page.goto("http://localhost:3000/server-function-blob");
    await expect(page.locator("#server-fn-test")).toContainText('{"result":true}');
  });
  test("should remove exports for non-function values when top-level use server is used", async ({ page }) => {
    await page.goto("http://localhost:3000/server-function-query-toplevel");
    await expect(page.locator("#server-fn-test")).toContainText('false');
  });

  // TODO not sure if this is the correct place
  test("should build with a env:server", async ({ page }) => {
    await page.goto("http://localhost:3000/server-env");
    await expect(page.locator("#server-fn-test")).toContainText('{"result":true}');
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  });

  test("should build with a server function including an unused try/catch variable", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/server-function-unused-trycatch");
    await expect(page.locator("#server-fn-test")).toContainText("false");
  });

  test("should build with a server function including an unused destructured variable", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/server-function-unused-destructure");
    await expect(page.locator("#server-fn-test")).toContainText("false");
  });

  /**
   * Makes sure that server function dead code elimination
   * runs before Solid's SSR transforms.
   *
   * Solid's SSR code removes client-only event handler code
   * such as onClick, but server function's only referenced
   * in such event handlers still must be registered on
   * the server.
   */
  test("should build with a server function only referenced inside onClick", async ({ page }) => {
    await page.goto("http://localhost:3000/server-function-onclick");
    await page.locator("#server-fn-test").click();
    await expect(page.locator("#server-fn-test")).toContainText("false");
  });
});
