import { expect, test } from "@playwright/test";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("check redirect", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/about.jsx": js`
        export default function AboutPage() {
          return <div data-testid="redirected">hello world</div>;
        }        
        `,
        "src/routes/index.jsx": js`
        import { createServerAction, redirect } from "solid-start/server";

export default function Page() {
  const externalRedirectAction = createServerAction(async () =>
    redirect("https://www.solidjs.com/")
  );

  const internalRedirectAction = createServerAction(async () => redirect("/about"));
  return (
    <div>
      <externalRedirectAction.Form>
        <button type="submit" id="external">
          external redirect
        </button>
      </externalRedirectAction.Form>
      <internalRedirectAction.Form>
        <button type="submit" id="internal">
          external redirect
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

  test("should redirect to an internal route", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    console.log(`redirect to about page`);

    await page.click("#internal");

    await page.waitForSelector("[data-testid='redirected']");
  });

  test("should redirect to an external url", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    console.log(`redirect to an external url`);

    await page.click("#external");

    await page.waitForURL("https://www.solidjs.com/");
  });
});
