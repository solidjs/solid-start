import { expect, test } from "@playwright/test";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("server error", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.skip(process.env.ADAPTER !== "solid-start-node");

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/server-error.tsx": js`
          import { createServerData, ServerError } from 'solid-start/server';
          import { useRouteData } from "@solidjs/router";
          import { ErrorBoundary } from 'solid-js';

          export function routeData() {
            return createServerData(async () => {
              throw new ServerError('Unauthorized', { status: 401 });
            });
          }

          export default function ServerErrorTest() {
            const data = useRouteData();
            return <ErrorBoundary fallback={e => <p id="error">{e.status} - {e.message}</p>}>
              <p>{data()}</p>
            </ErrorBoundary>;
          }
        `,
      }
    });

    appFixture = await fixture.createServer();
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test("server data should throw server error with custom status", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    const response = await app.goto("/server-error");
    const element = await page.waitForSelector("#error", { state: "visible" });
    expect(await element.textContent()).toBe('401 - Unauthorized');
  });
});
