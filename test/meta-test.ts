import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture, prettyHtml, selectHtml } from "./helpers/playwright-fixture.js";

test.describe("meta", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/index.tsx": js`
          import { Title } from 'solid-meta';
          export default function Index() {
            return <>
              <Title>Index page</Title>
              <h1>Index</h1>
            </>;
          }
        `,
        "src/routes/no-title.tsx": js`
          export default function NoTitle() {
            return <>
              <h1>No title</h1>
            </>;
          }
        `,
        "src/routes/title-from-resource.tsx": js`
          import { Title } from 'solid-meta';
          import { createResource } from 'solid-js';
          export default function TitleFromData() {
            const [data] = createResource(async () => "Title from data");
            return <>
              <Show when={data()}><Title>{data()}</Title></Show>
              <h1>No title</h1>
            </>;
          }
        `,
        "src/routes/title-from-route-data.tsx": js`
          import { Title } from 'solid-meta';
          import { createServerData } from 'solid-start/server';
          import { useRouteData } from 'solid-app-router';

          export function routeData() {
            return createServerData(async () => "Title from route data");
          }

          export default function TitleFromData() {
            const data = useRouteData();
            return <>
              <Show when={data()}><Title>{data()}</Title></Show>
              <h1>No title</h1>
            </>;
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

  test("<meta charset='utf-8' /> in root add tag", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    expect(await app.getHtml('meta[charset="utf-8"]')).toBeTruthy();
  });

  test("<Title /> component adds a <title />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    expect(await app.getHtml("title")).toBeTruthy();
    await expect(page).toHaveTitle("Index page");
  });

  test("<Title /> component with resource adds a <title />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/title-from-resource");

    expect(await app.getHtml("title")).toBeTruthy();
    await expect(page).toHaveTitle("Title from data");
  });

  test("<Title /> component with resource adds a <title /> in SSR", async () => {
    let res = await fixture.requestDocument("/title-from-resource");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(selectHtml(await res.text(), "title")).toBe(
      prettyHtml(`<title data-sm="">Title from data</title>`)
    );
  });

  test("<Title /> component with routeData adds a <title />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/title-from-route-data");

    expect(await app.getHtml("title")).toBeTruthy();
    await expect(page).toHaveTitle("Title from route data");
  });

  test("<Title /> component with routeData adds a <title /> in SSR", async () => {
    let res = await fixture.requestDocument("/title-from-route-data");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(selectHtml(await res.text(), "title")).toBe(
      prettyHtml(`<title data-sm="">Title from route data</title>`)
    );
  });

  test("no <Title /> component should not have <title />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/no-title");

    expect(app.getHtml("title")).rejects.toThrow();
  });
});

test.describe("streaming meta", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/entry-server.tsx": js`
          import { StartServer, createHandler, renderStream } from "solid-start/entry-server";
          export default createHandler(renderStream(context => <StartServer context={context} />));
        `,
        "src/routes/index.tsx": js`
          import { Title } from 'solid-meta';
          export default function Index() {
            return <>
              <Title>Index page</Title>
              <h1>Index</h1>
            </>;
          }
        `,
        "src/routes/no-title.tsx": js`
          export default function NoTitle() {
            return <>
              <h1>No title</h1>
            </>;
          }
        `,
        "src/routes/title-from-resource.tsx": js`
          import { Title } from 'solid-meta';
          import { createResource } from 'solid-js';
          export default function TitleFromData() {
            const [data] = createResource(async () => {
              await new Promise(res => setTimeout(res, 1000));
              return "Title from data"
            }, {
              deferStream: true
            });
            return <>
              <Show when={data()}><Title>{data()}</Title></Show>
              <h1>No title</h1>
            </>;
          }
        `,
        "src/routes/title-from-route-data.tsx": js`
          import { Title } from 'solid-meta';
          import { createServerData } from 'solid-start/server';
          import { useRouteData } from 'solid-app-router';

          export function routeData() {
            return createServerData(async () => {
              await new Promise(res => setTimeout(res, 1000));
              return "Title from route data" 
            }, {
              deferStream: true
            });
          }

          export default function TitleFromData() {
            const data = useRouteData();
            return <>
              <Show when={data()}><Title>{data()}</Title></Show>
              <h1>No title</h1>
            </>;
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

  test("<meta charset='utf-8' /> in root add tag", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    expect(await app.getHtml('meta[charset="utf-8"]')).toBeTruthy();
  });

  test("<Title /> component adds a <title />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    expect(await app.getHtml("title")).toBeTruthy();
    await expect(page).toHaveTitle("Index page");
  });

  test("<Title /> component with resource adds a <title />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/title-from-resource");

    expect(await app.getHtml("title")).toBeTruthy();
    await expect(page).toHaveTitle("Title from data");
  });

  test("<Title /> component with resource adds a <title /> in SSR", async () => {
    let res = await fixture.requestDocument("/title-from-resource");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(selectHtml(await res.text(), "title")).toBe(
      prettyHtml(`<title data-sm="">Title from data</title>`)
    );
  });

  test("<Title /> component with routeData adds a <title />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/title-from-route-data");

    expect(await app.getHtml("title")).toBeTruthy();
    await expect(page).toHaveTitle("Title from route data");
  });

  test("<Title /> component with routeData adds a <title /> in SSR", async () => {
    let res = await fixture.requestDocument("/title-from-route-data");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(selectHtml(await res.text(), "title")).toBe(
      prettyHtml(`<title data-sm="">Title from route data</title>`)
    );
  });

  test("no <Title /> component should not have <title />", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/no-title");

    expect(app.getHtml("title")).rejects.toThrow();
  });
});
