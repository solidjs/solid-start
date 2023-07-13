import { expect, test } from "@playwright/test";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("api routes", () => {
  let appFixture: AppFixture;
  let fixture: Fixture;

  test.describe("with SSR", () => {
    runTests(true);
  });

  test.describe("without SSR", () => {
    runTests(false);
  });

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
          "src/routes/index.jsx": js`
            export default () => (
              <>
                <a href="/redirect" rel="external">Redirect</a>
                <a href="/server-data-fetch">Server data fetch</a>
                <a href="/server-fetch">Server Fetch</a>
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

            export let GET = () => redirect("/redirected");
          `,
          "src/routes/redirect-to.jsx": js`
            import { redirect } from "solid-start/server";

            export let POST = async ({ request }) => {
              let formData = await request.formData();
              return redirect(formData.get('destination'));
            }
          `,
          "src/routes/redirect-destination.jsx": js`
            export default () => <div data-testid="redirect-destination">You made it!</div>
          `,
          "src/routes/data.json.jsx": js`
            import { json } from "solid-start/server";
            export let GET = () => json({hello: "world"});
          `,
          "src/routes/api/greeting/hello.js": js`
            import { json } from "solid-start/server";
            export let GET = ({ params }) => json({hello: "world"});
          `,
          "src/routes/api/greeting/[name].js": js`
            import { json } from "solid-start/server";
            export let GET = ({ params }) => json({welcome: params.name});
          `,
          "src/routes/api/greeting/[[title]]/[name]/intro.js": js`
            import { json } from "solid-start/server";
            export let GET = ({ params }) => json(params);
          `,
          "src/routes/api/greeting/[...unknown].js": js`
            import { json } from "solid-start/server";
            export let GET = ({ params }) => json({goodbye: params.unknown});
          `,
          "src/routes/api/request.js": js`
            import { json } from "solid-start/server";
            export let GET = ({ request }) => json({ requesting: request.headers.get("name") });
          `,
          "src/routes/api/waterfall.js": js`
            import { json } from "solid-start/server";
            export let GET = ({ request, fetch  }) => fetch('/api/greeting/harry-potter');
          `,
          "src/routes/api/double-waterfall.js": js`
            import { json } from "solid-start/server";
            export let GET = ({ request, fetch }) => fetch('/api/waterfall');
          `,
          "src/routes/api/rewrite.js": js`
            import { json } from "solid-start/server";
            export let GET = ({ request, fetch }) => fetch('/redirected');
          `,
          "src/routes/api/external-fetch.js": js`
            import { json } from "solid-start/server";
            export let GET = ({ request, fetch }) => fetch('https://hogwarts.deno.dev/');
          `,
          "src/routes/api/fetch.js": js`
            import { json } from "solid-start/server";
            export let GET = ({ request }) => fetch('https://hogwarts.deno.dev/');
          `,
          "src/routes/server-fetch.jsx": js`
            import server$ from "solid-start/server";
            import { createResource } from 'solid-js';

            export default function Page() {
              const [data] = createResource(() => server$.fetch('/api/greeting/harry-potter').then(res => res.json()));

              return <Show when={data()}><div data-testid="data">{data()?.welcome}</div></Show>;
            }
          `,
          "src/routes/server-data-fetch.jsx": js`
            import server$, { createServerData$ } from "solid-start/server";

            export default function Page() {
              const data = createServerData$(() => server$.fetch('/api/greeting/harry-potter').then(res => res.json()));

              return <Show when={data()}><div data-testid="data">{data()?.welcome}</div></Show>;
            }
          `,
          "src/routes/api/static.js": js`
            import { json } from "solid-start/server";
            export let GET = () => json({ static: true });
          `,
          "src/routes/api/[param]/index.js": js`
            import { json } from "solid-start/server";
            export let GET = ({ params }) => json(params);
          `
        }
      });

      appFixture = await fixture.createServer();
    });

    test.afterAll(async () => {
      await appFixture.close();
    });

    test("should redirect to redirected", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);

      await page.click("a[href='/redirect']");
      await page.waitForSelector("[data-testid='redirected']");
    });

    test("should handle post to destination", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/", true);
      await page.click("button[type='submit']");
      await page.waitForSelector("[data-testid='redirect-destination']");
    });

    test("should render json from API route with .json file extension", async ({ page }) => {
      test.skip(process.env.START_ADAPTER === "solid-start-cloudflare-pages");

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/data.json");
      expect(await page.content()).toContain('{"hello":"world"}');
    });

    if (ssr) {
      test("should render data from API route using server$.fetch", async ({ page }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/server-fetch");
        let dataEl = await page.waitForSelector("[data-testid='data']");
        expect(await dataEl!.innerText()).toBe("harry-potter");

        await app.goto("/", true);
        await page.click("a[href='/server-fetch']");
        dataEl = await page.waitForSelector("[data-testid='data']");
        expect(await dataEl!.innerText()).toBe("harry-potter");
      });

      test("should render data from API route using serverData with server$.fetch", async ({
        page
      }) => {
        let app = new PlaywrightFixture(appFixture, page);
        await app.goto("/server-data-fetch");
        let dataEl = await page.waitForSelector("[data-testid='data']");
        expect(await dataEl!.innerText()).toBe("harry-potter");

        await app.goto("/", true);
        await page.click("a[href='/server-data-fetch']");
        dataEl = await page.waitForSelector("[data-testid='data']");
        expect(await dataEl!.innerText()).toBe("harry-potter");
      });
    }

    test("should return json from API route", async ({ page }) => {
      test.skip(process.env.START_ADAPTER === "solid-start-cloudflare-pages");

      let res = await fixture.requestDocument("/data.json");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ hello: "world" });
    });

    test("should return json from /api/greeting/hello API route", async () => {
      let res = await fixture.requestDocument("/api/greeting/hello");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ hello: "world" });
    });

    test("should return json from /api/greeting/[name] API named route", async () => {
      let res = await fixture.requestDocument("/api/greeting/harry-potter");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ welcome: "harry-potter" });
    });

    test("should rewrite", async ({ page }) => {
      test.skip(!ssr);

      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/api/rewrite", true);
      await page.waitForSelector("[data-testid='redirected']");
    });

    test("should return json from /api/greeting/[[title]]/[name]/intro optional param API route", async () => {
      let res = await fixture.requestDocument("/api/greeting/mr/harry-potter/intro");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ title: "mr", name: "harry-potter" });

      res = await fixture.requestDocument("/api/greeting/hermione-granger/intro");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ name: "hermione-granger" });
    });

    test("should return json from /api/greeting/[...unknown] API unmatched route", async () => {
      let res = await fixture.requestDocument("/api/greeting/he/who/must/not/be/named");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ goodbye: "he/who/must/not/be/named" });
    });

    test("should return json with header data from request", async () => {
      let res = await fixture.requestDocument("/api/request", {
        headers: { name: "harry-potter" }
      });
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ requesting: "harry-potter" });
    });

    test("should return json from internally fetched API route", async () => {
      let res = await fixture.requestDocument("/api/waterfall");
      expect(await res.json()).toEqual({ welcome: "harry-potter" });
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    });

    test("should return json from doubly internally fetched API route", async () => {
      let res = await fixture.requestDocument("/api/double-waterfall");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ welcome: "harry-potter" });
    });

    test("should return json from externally fetched API route", async () => {
      let res = await fixture.requestDocument("/api/double-waterfall");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ welcome: "harry-potter" });
    });

    test("should return json from API route with external fetch call", async () => {
      let res = await fixture.requestDocument("/api/external-fetch");
      expect(res.headers.get("content-type")).toEqual("application/json");
      expect(await res.json()).toEqual({ message: "Hello from Hogwarts" });
    });

    test("should return json from API route with global fetch call", async () => {
      let res = await fixture.requestDocument("/api/fetch");
      expect(res.headers.get("content-type")).toEqual("application/json");
      expect(await res.json()).toEqual({ message: "Hello from Hogwarts" });
    });

    test("/:param/ should not be matched over /static", async () => {
      let res = await fixture.requestDocument("/api/static");
      expect(res.headers.get("content-type")).toEqual("application/json; charset=utf-8");
      expect(await res.json()).toEqual({ static: true });
    });
  }
});
