import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture, prettyHtml } from "./helpers/playwright-fixture.js";

test.describe("actions", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        // "src/entry-client.tsx": js`
        //   import { render } from "solid-js/web";
        //   import { StartClient } from "solid-start/entry-client";

        //   render(() => <StartClient />, document.body);
        // `,
        // "vite.config.ts": js`
        //   import { defineConfig } from "vite";
        //   import solid from "solid-start";

        //   export default defineConfig({
        //     plugins: [solid({ ssr: false })]
        //   });
        // `,
        // "src/root.tsx": js`
        //   import { Links, Meta, FileRoutes, Scripts } from "solid-start/root";
        //   import { Routes } from "solid-app-router";
        //   import { Suspense } from "solid-js";

        //   export default function Root() {
        //     return (
        //       <>
        //         <div id="content">
        //           <h1>Root</h1>
        //           <Routes><FileRoutes /></Routes>
        //         </div>
        //       </>
        //     );
        //   }
        // `,
        // "index.html": js`
        //   <!DOCTYPE html>
        //   <html lang="en">
        //     <head>
        //       <meta charset="utf-8" />
        //       <meta name="viewport" content="width=device-width, initial-scale=1" />
        //       <script type="module" src="./src/entry-client.tsx"></script>
        //     </head>
        //     <body></body>
        //   </html>
        // `,
        "src/routes/client-action.tsx": js`
          import { createRouteAction } from 'solid-start/data';

          export default function Index() {
            const action = createRouteAction(async (params) => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (params.hello === "world") {
                return "success";
              }
              else throw new Error('Wrong planet');
            })
            return (
              <>
                <button onClick={e => action.submit({ hello: "world" })} id="submit-earth">Earth</button>
                <button onClick={e => action.submit({ hello: "mars" })} id="submit-mars">Mars</button>
                <button onClick={e => action.reset()} id="reset">Reset</button>
                <Show when={action.value}><p id="result">{action.value}</p></Show>
                <Show when={action.state === "pending"}><p id="pending">Pending</p></Show>
                <Show when={action.error}>{e => <p id="error">{e.message}</p>}</Show>
              </>
            );
          }
        `,
        "src/routes/server-action.tsx": js`
          import { createServerAction } from 'solid-start/server';

          export default function Index() {
            const action = createServerAction(async (params) => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (params.hello === "world") {
                return "success";
              }
              else throw new Error('Wrong planet');
            })

            return (
              <>
                <button onClick={e => action.submit({ hello: "world" })} id="submit-earth">Earth</button>
                <button onClick={e => action.submit({ hello: "mars" })} id="submit-mars">Mars</button>
                <button onClick={e => action.reset()} id="reset">Reset</button>
                <Show when={action.value}><p id="result">{action.value}</p></Show>
                <Show when={action.state === "pending"}><p id="pending">Pending</p></Show>
                <Show when={action.error}>{e => <p id="error">{e.message}</p>}</Show>
              </>
            );
          }
        `,
        "src/routes/server-action-error-boundary.tsx": js`
          import { createServerAction } from 'solid-start/server';

          export default function Index() {
            const action = createServerAction(async (params) => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (params.hello === "world") {
                return "success";
              }
              else throw new Error('Wrong planet');
            })

            return (
              <>
                <button onClick={e => action.submit({ hello: "world" })} id="submit-earth">Earth</button>
                <button onClick={e => action.submit({ hello: "mars" })} id="submit-mars">Mars</button>
                <button onClick={e => action.reset()} id="reset">Reset</button>
                <Show when={action.value}><p id="result">{action.value}</p></Show>
                <Show when={action.state === "pending"}><p id="pending">Pending</p></Show>
              </>
            );
          }
        `
      }
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test("client-side action submitted without form", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/client-action", true);

    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);

    // successful submission
    await page.click("button#submit-earth");
    expect(await page.isVisible("#pending")).toBe(true);
    await page.waitForSelector("#result", {
      state: "visible"
    });

    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
    expect(await app.getHtml("#result")).toBe(prettyHtml(`<p id="result">success</p>`));

    // error submission
    await page.click("button#submit-mars");
    expect(await page.isVisible("#pending")).toBe(true);
    expect(await page.isVisible("#result")).toBe(true);
    await page.waitForSelector("#error", {
      state: "visible"
    });
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await app.getHtml("#error")).toBe(prettyHtml(`<p id="error">Wrong planet</p>`));

    // reset
    await page.click("button#reset");
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
  });

  test("server-side action submitted without form", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/server-action", true);

    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);

    // successful submission
    await page.click("button#submit-earth");
    expect(await page.isVisible("#pending")).toBe(true);
    await page.waitForSelector("#result", {
      state: "visible"
    });

    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
    expect(await app.getHtml("#result")).toBe(prettyHtml(`<p id="result">success</p>`));

    // error submission
    await page.click("button#submit-mars");
    expect(await page.isVisible("#pending")).toBe(true);
    expect(await page.isVisible("#result")).toBe(true);
    await page.waitForSelector("#error", {
      state: "visible"
    });
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await app.getHtml("#error")).toBe(prettyHtml(`<p id="error">Wrong planet</p>`));

    // reset
    await page.click("button#reset");
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#error")).toBe(false);
  });

  test("server-side action when error should hit ErrorBoundary", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/server-action-error-boundary", true);

    expect(await page.isVisible("#result")).toBe(false);
    expect(await page.isVisible("#pending")).toBe(false);

    // error submission
    await page.click("button#submit-mars");
    expect(await page.isVisible("#pending")).toBe(true);
    await page.waitForSelector("#error-message", {
      state: "visible"
    });
    expect(await page.isVisible("#pending")).toBe(false);
    expect(await page.isVisible("#result")).toBe(false);
    expect(await app.getHtml("#error-message")).toBe(
      prettyHtml(`<p id="error-message" style="font-weight: bold">Wrong planet</p>`)
    );
  });
});
