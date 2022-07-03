import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture, prettyHtml, selectHtml } from "./helpers/playwright-fixture.js";

test.describe("rendering", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/root.tsx": js`
          import { Links, Meta, Routes, Scripts } from "solid-start/root";
          import { Suspense } from "solid-js";

          export default function Root() {
            return (
              <html lang="en">
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <Meta />
                  <Links />
                </head>
                <body>
                  <nav>
                    <a href="/">Home</a>
                    <a href="/about">About</a>
                  </nav>
                  <div id="content">
                    <h1>Root</h1>
                    <Routes />
                  </div>
                  <Scripts />
                </body>
              </html>
            );
          }
        `,
        "src/routes/index.tsx": js`
          export default function Index() {
            return <h2>Index</h2>;
          }
        `,
        "src/routes/about.tsx": js`
          export default function Index() {
            return <h2>About</h2>;
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

  test("server renders matching routes", async () => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(selectHtml(await res.text(), "#content")).toBe(
      prettyHtml(`
        <div id="content">
          <h1>Root</h1>
          <!--#-->
          <h2 data-hk="0-0-0-0-0-0-0-1-0-0-0-0-0">Index</h2>
          <!--/-->
        </div>`)
    );

    res = await fixture.requestDocument("/about");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(selectHtml(await res.text(), "#content")).toBe(
      prettyHtml(`
        <div id="content">
          <h1>Root</h1>
          <!--#-->
          <h2 data-hk="0-0-0-0-0-0-0-1-0-0-0-0-0">About</h2>
          <!--/-->
        </div>`)
    );
  });

  test("hydrates", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    expect(await app.getHtml("#content")).toBe(
      prettyHtml(`
        <div id="content">
          <h1>Root</h1>
          <!--#-->
          <h2 data-hk="0-0-0-0-0-0-0-1-0-0-0-0-0">Index</h2>
          <!--/-->
        </div>`)
    );

    await app.goto("/about", true);
    expect(await app.getHtml("#content")).toBe(
      prettyHtml(`
        <div id="content">
          <h1>Root</h1>
          <!--#-->
          <h2 data-hk="0-0-0-0-0-0-0-1-0-0-0-0-0">About</h2>
          <!--/-->
        </div>`)
    );
  });

  test("navigates", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    expect(await app.getHtml("#content")).toBe(
      prettyHtml(`
        <div id="content">
          <h1>Root</h1>
          <!--#-->
          <h2 data-hk="0-0-0-0-0-0-0-1-0-0-0-0-0">Index</h2>
          <!--/-->
        </div>`)
    );

    await app.page.click("a[href='/about']");

    expect(await app.getHtml("#content")).toBe(
      prettyHtml(`
        <div id="content">
          <h1>Root</h1>
          <!--#-->
          <h2>About</h2>
          <!--/-->
        </div>`)
    );
  });
});
