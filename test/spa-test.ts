import { expect, test } from "@playwright/test";

import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture, prettyHtml, selectHtml } from "./helpers/playwright-fixture.js";

test.describe("spa rendering", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;
  test.skip(process.env.ADAPTER !== "solid-start-node");

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/entry-client.tsx": js`
          import { render } from "solid-js/web";
          import { StartClient } from "solid-start/entry-client";
          
          render(() => <StartClient />, document.body);
        `,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import solid from "solid-start";

          export default defineConfig({
            plugins: [solid({ ssr: false, adapter: process.env.ADAPTER })]
          });
        `,
        "src/root.tsx": js`
          import { Links, Meta, FileRoutes, Scripts } from "solid-start/root";
          import { Routes } from "solid-app-router";
          import { Suspense } from "solid-js";

          export default function Root() {
            return (
              <>
                <div id="content">
                  <h1>Root</h1>
                  <Routes><FileRoutes /></Routes>
                </div>
              </>
            );
          }
        `,
        "index.html": js`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <script type="module" src="./src/entry-client.tsx"></script>
            </head>
            <body></body>
          </html>
        `,
        "src/routes/index.tsx": js`
          export default function Index() {
            return <h2>Index</h2>;
          }
        `,
        "src/routes/about.tsx": js`
          export default function About() {
            return <h2>About</h2>;
          }
        `
      }
    });

    appFixture = await fixture.createServer();
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

  test("server rendering doesn't include content", async () => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(async () => selectHtml(await res.text(), "#content")).rejects.toThrow();
  });

  test("client side rendering", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);
    expect(await app.getHtml("#content")).toBe(
      prettyHtml(`
      <div id="content">
        <h1>Root</h1>
        <h2>Index</h2>
      </div>`)
    );

    await app.goto("/about", true);
    expect(await app.getHtml("#content")).toBe(
      prettyHtml(`
      <div id="content">
        <h1>Root</h1>
        <h2>About</h2>
      </div>`)
    );
  });
});
