import { test, expect } from "@playwright/test";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";

test.describe("api routes", () => {
  let appFixture: AppFixture;
  let fixture: Fixture;
  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/index.jsx": js`
          export default () => (
            <>
              <a href="/redirect" rel="external">Redirect</a>
              <form action="/redirect-to" method="post">
                <input name="destination" value="/redirect-destination" />
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

          export let get = () => redirect("/redirected");
        `,
        "src/routes/redirect-to.jsx": js`
          import { redirect } from "solid-start/server";

          export let post = async ({ request }) => {
            let formData = await request.formData();
            return redirect(formData.get('destination'));
          }
        `,
        "src/routes/redirect-destination.jsx": js`
          export default () => <div data-testid="redirect-destination">You made it!</div>
        `,
        "src/routes/data.json.jsx": js`
          import { json } from "solid-start/server";
          export let get = () => json({hello: "world"});
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
      await page.waitForSelector("[data-testid='redirected']");
    });

    test("should handle post to destination", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");
      await page.click("button[type='submit']");
      await page.waitForSelector("[data-testid='redirect-destination']");
    });

    test("should render json from API route", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/data.json");
      expect(await page.content()).toContain('{"hello":"world"}');
    });

    test("should load json from API route", async ({ page }) => {
      let res = await fixture.requestDocument("/data.json");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ hello: "world" });
    });
  }
});
