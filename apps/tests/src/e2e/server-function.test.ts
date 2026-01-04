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
});
