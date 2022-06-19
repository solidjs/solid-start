import { test, expect } from "@playwright/test";

import { createFixture, createAppFixture, js } from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("loader", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/index.tsx": js`
          export default function Index() {
            return <div id="text">Hello World</div>
          }
        `
      }
    });
    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  let logs: string[] = [];

  test.beforeEach(({ page }) => {
    page.on("console", msg => {
      logs.push(msg.text());
    });
  });

  test.afterEach(() => {
    expect(logs).toHaveLength(0);
  });

  test("returns responses for a specific route", async () => {
    let root = await fixture.requestDocument("/");

    expect(root.headers.get("Content-Type")).toBe("text/html");
  });

  test("is called on script transition POST requests", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto(`/`);
    let html = await app.getHtml("#text");
    expect(html).toMatch("Hello World");
  });
});
