import { test, expect } from "@playwright/test";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";

test.describe("external redirect", () => {
  let appFixture: AppFixture;
  let fixture: Fixture;
  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/index.jsx": js`
          export default () => (
            <>
              <a href="/redirect" rel="external">Redirect</a>
              <a href="/redirect-data">Redirect</a>
              <form action="/redirect-to" method="post">
                <input name="destination" value="https://hogwarts.deno.dev/callback" />
                <button type="submit">Redirect</button>
              </form>
            </>
          )
        `,
        "src/routes/redirected.jsx": js`
          export default () => <div data-testid="redirected">You were redirected</div>;
        `,
        "src/routes/redirect.jsx": js`
          import { redirect } from "solid-start/server";

          export let get = () => redirect("https://hogwarts.deno.dev/callback");
        `,
        "src/routes/redirect-to.jsx": js`
          import { redirect } from "solid-start/server";

          export let post = async ({ request }) => {
            let formData = await request.formData();
            return redirect(formData.get('destination'));
          }
        `,
        "src/routes/redirect-data.jsx": js`
          import { createServerData } from 'solid-start/server';
          import { redirect } from 'solid-start/server';
          import { useRouteData } from 'solid-app-router';

          export function routeData() {
            return createServerData(async () => redirect('https://hogwarts.deno.dev/callback'));

          }

          export default function Route() {
            const data = useRouteData();

            return <Show when={data()}>{data()}</Show>;
          }
        `,
        "src/routes/throw-redirect-data.jsx": js`
          import { createServerData } from 'solid-start/server';
          import { redirect } from 'solid-start/server';
          import { useRouteData } from 'solid-app-router';

          export function routeData() {
            return createServerData(async () => {
              throw redirect('https://hogwarts.deno.dev/callback')
            });

          }

          export default function Route() {
            const data = useRouteData();

            return <Show when={data()}>{data()}</Show>;
          }
        `,
        "src/routes/redirect-action.jsx": js`
          import { createServerAction, redirect } from "solid-start/server";

          export default function Page() {
            const externalRedirectAction = createServerAction(async () =>
              redirect("https://hogwarts.deno.dev/callback")
            );
          
            const internalRedirectAction = createServerAction(async () => redirect("/redirected"));
            return (
              <div>
                <externalRedirectAction.Form>
                  <button type="submit" id="external">
                    external redirect
                  </button>
                </externalRedirectAction.Form>
                <internalRedirectAction.Form>
                  <button type="submit" id="internal">
                    internal redirect
                  </button>
                </internalRedirectAction.Form>
              </div>
            );
          }
        `,
        "src/routes/throw-redirect-action.jsx": js`
          import { createServerAction, redirect } from "solid-start/server";

          export default function Page() {
            const externalRedirectAction = createServerAction(async () => {
              throw redirect("https://hogwarts.deno.dev/callback")
            });
          
            const internalRedirectAction = createServerAction(async () => {
              throw redirect("/redirected")
            });
            return (
              <div>
                <externalRedirectAction.Form>
                  <button type="submit" id="external">
                    external redirect
                  </button>
                </externalRedirectAction.Form>
                <internalRedirectAction.Form>
                  <button type="submit" id="internal">
                    internal redirect
                  </button>
                </internalRedirectAction.Form>
              </div>
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

  test.describe("with JavaScript", () => {
    runTests();
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    runTests();
  });

  function runTests() {
    test("should redirect to redirected", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.click("a[href='/redirect']");
      await page.waitForURL("https://hogwarts.deno.dev/callback");
    });

    test("should handle post to destination", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.click("button[type='submit']");
      await page.waitForURL("https://hogwarts.deno.dev/callback");
    });

    test("should handle redirect from server data function", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/redirect-data");
      await page.waitForURL("https://hogwarts.deno.dev/callback");
    });

    test("should handle thrown redirect from server data function", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/redirect-data");
      await page.waitForURL("https://hogwarts.deno.dev/callback");
    });

    test("should handle redirect when navigating to route with server data function", async ({
      page
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.click("a[href='/redirect-data']");
      await page.waitForURL("https://hogwarts.deno.dev/callback");
    });

    test("should handle thrown redirect when navigating to route with server data function", async ({
      page
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.click("a[href='/redirect-data']");
      await page.waitForURL("https://hogwarts.deno.dev/callback");
    });

    test("should handle external redirect from server action function", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/redirect-action");
      await page.click("#external");
      await page.waitForURL("https://hogwarts.deno.dev/callback");
    });

    test("should redirect to an internal route from server action function", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/redirect-action");
      await page.click("#internal");
      await page.waitForSelector("[data-testid='redirected']");
    });

    test("should handle thrown external redirect from server action function", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/throw-redirect-action");
      await page.click("#external");
      await page.waitForURL("https://hogwarts.deno.dev/callback");
    });

    test("should handle thrown redirect to an internal route from server action function", async ({
      page
    }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/throw-redirect-action");
      await page.click("#internal");
      await page.waitForSelector("[data-testid='redirected']");
    });
  }
});
