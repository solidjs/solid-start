import { expect, test } from "@playwright/test";

import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture, prettyHtml, selectHtml } from "./helpers/playwright-fixture.js";

test.describe("spa rendering", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  const files = {
    "vite.config.ts": js`
      import { defineConfig } from "vite";
      import solid from "solid-start/vite";

      export default defineConfig({
        plugins: [solid({ ssr: false, adapter: process.env.START_ADAPTER })]
      });
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
  };
  test.describe("with index.html", () => {
    test.beforeAll(async () => {
      fixture = await createFixture({
        files: {
          ...files,
          "src/root.tsx": js`
            import { Meta, FileRoutes, Scripts, Routes } from "solid-start";
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
          `
        }
      });

      appFixture = await fixture.createServer();
    });

    test.afterAll(async () => {
      await appFixture.close();
    });

    runTests();
  });

  test.describe("with root.tsx", () => {
    test.beforeAll(async () => {
      fixture = await createFixture({
        files: {
          ...files,
          "src/root.tsx": js`
            import { Suspense } from "solid-js";
            import { Html, Head, Body, Meta, FileRoutes, Scripts, Routes } from "solid-start";

            export default function Root() {
              return (
                <Html lang="en">
                  <Head>
                    <Meta charset="utf-8" />
                    <Meta name="viewport" content="width=device-width, initial-scale=1" />
                  </Head>
                  <Body>
                    <div id="content">
                      <h1>Root</h1>
                      <Routes>
                        <FileRoutes />
                      </Routes>
                    </div>
                    <Scripts />
                  </Body>
                </Html>
              );
            }
          `
        }
      });

      appFixture = await fixture.createServer();
    });

    test.afterAll(async () => {
      await appFixture.close();
    });

    runTests();
  });

  test.describe("with root-csr.tsx", () => {
    test.beforeAll(async () => {
      fixture = await createFixture({
        files: {
          ...files,
          "src/root.tsx": js`
            import { Meta, FileRoutes, Scripts, Routes } from "solid-start";
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
          "src/root-csr.tsx": js`
            import { NoHydration } from "solid-js/web";
            import { Body, Head, Html, Meta, Title } from "solid-start";
          
            export default function Root() {
              return (
                <Html lang="en">
                  <Head>
                    <Title>SolidStart - Bare</Title>
                    <Meta charset="utf-8" />
                    <Meta name="viewport" content="width=device-width, initial-scale=1" />
                    <meta name="test" content="test" />
                  </Head>
                  <Body />
                </Html>
              );
            }
          `
        }
      });
      appFixture = await fixture.createServer();
    });

    test.afterAll(async () => {
      await appFixture.close();
    });

    runTests();

    test("server index.html includes Head", async ({ page }) => {
      let res = await fixture.requestDocument("/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")?.includes("text/html")).toBe(true);
      const html = await res.text();
      // duplicate test from test-meta.ts but only for csr index.html
      expect(await selectHtml(html, "title")).toBe(
        prettyHtml(`<title data-sm="0-0-0-0-0-0-0-0-0-0-0-0" >SolidStart - Bare</title>`)
      );
      expect(selectHtml(await html, 'meta[charset="utf-8"]')).toBe(
        prettyHtml(`<meta data-sm="0-0-0-0-0-0-0-0-0-0-0-1" charset="utf-8" />`)
      );
      expect(await selectHtml(html, "meta[name='viewport']")).toBe(
        prettyHtml(
          `<meta data-sm="0-0-0-0-0-0-0-0-0-0-0-2" name="viewport" content="width=device-width, initial-scale=1">`
        )
      );
      expect(await selectHtml(html, "meta[name='test']")).toBe(
        prettyHtml(`<meta name="test" content="test">`)
      );
    });

    test("client removes Meta sent from server", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      expect(async () => await app.getHtml("meta[data-sm*='0-']")).rejects.toThrow();
    });
  });

  function runTests() {
    test("server rendering doesn't include content", async () => {
      let res = await fixture.requestDocument("/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")?.includes("text/html")).toBe(true);
      expect((async () => selectHtml(await res.text(), "#content"))()).rejects.toThrow();
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
  }
});
