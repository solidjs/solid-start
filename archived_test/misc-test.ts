import { expect, test } from "@playwright/test";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("miscellaneous tests", () => {
  let appFixture: AppFixture;
  let fixture: Fixture;

  test.describe("with SSR", () => {
    runTests(true);
  });

  // test.describe("without SSR", () => {
  //   runTests(false);
  // });

  function runTests(ssr) {
    test.beforeAll(async () => {
      fixture = await createFixture({
        files: {
          "vite.config.ts": js`
            import solid from "solid-start/vite";
            import { defineConfig } from "vite";

            export default defineConfig({
              plugins: [
                solid({ ssr: ${ssr ? "true" : "false"}})
              ]
            });
          `,
          "src/server/server-function-in-js-file.js": js`
            import server$ from "solid-start/server";

            export const echo = server$(msg => msg);
          `,
          "src/routes/server-function-in-js-file.jsx": js`
            import { createResource } from 'solid-js';
            import { echo } from "../server/server-function-in-js-file";

            export default function Page() {
              const [data] = createResource(() => echo({ welcome: "hello" }));

              return <Show when={data()}><div data-testid="data">{data()?.welcome}</div></Show>;
            }
          `
        }
      });

      appFixture = await fixture.createServer();
    });

    test.afterAll(async () => {
      await appFixture.close();
    });

    test("should be able to create a server function inside of a .js file", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/server-function-in-js-file");
      let dataEl = await page.waitForSelector("[data-testid='data']");
      expect(await dataEl!.innerText()).toBe("hello");
    });
  }

  test.describe("cookies", () => {
    test.beforeAll(async () => {
      fixture = await createFixture({
        files: {
          "src/routes/api/cookies.jsx": js`
            export async function GET({ request }) {
              const headers = new Headers();
              headers.append('set-cookie', 'c1=1');
              headers.append('set-cookie', 'c2=2');
              return new Response('', { headers });
            }
          `
        }
      });
  
      appFixture = await fixture.createServer();
    });
  
    test.afterAll(async () => {
      await appFixture.close();
    });
  
    test("should set two cookies when appending two cookies to response headers", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto('/api/cookies');
      const cookies = await page.context().cookies();
      expect(cookies.length).toBe(2);
    });
  });
});
