import { test, expect } from "@playwright/test";

import { createAppFixture, createFixture, js } from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture, prettyHtml, selectHtml } from "./helpers/playwright-fixture.js";

function testMeta() {}

test.describe("meta", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.describe("without streaming", () => {
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
          `,
          "src/routes/title-from-error-boundary.tsx": js`
            import { Title, Meta } from 'solid-meta';
            import { createResource, ErrorBoundary } from 'solid-js';

            export default function TitleFromErrorBoundary() {
              const [data] = createResource(async () => {
                throw new Error('Error')
              });
              return <>
                <ErrorBoundary fallback={e => <Title>{e.message}</Title>}>
                  <h1>No title</h1>
                  <Show when={data()}><Title>{data()}</Title></Show>
                  <Meta name="description" value="Should not be rendered" />
                </ErrorBoundary>
              </>;
            }
          `,
          "src/routes/title-from-suspense.tsx": js`
            import { Title, Meta } from 'solid-meta';
            import { createResource, ErrorBoundary } from 'solid-js';
  
            export default function TitleFromErrorBoundary() {
              const [data] = createResource(async () => {
                return "Hello world"
              });
              return <>
                <Suspense fallback={() => (<>
                  <Title>Waiting</Title>
                  <Meta name="description" value="Should not be rendered" />
                </>)}>
                  <h1>No title</h1>
                  <Show when={data()}><Title>{data()}</Title></Show>
                </Suspense>
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

    runTests();
  });

  test.describe("with streaming", () => {
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
              const [data] = createResource(async () => "Title from data", {
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
              return createServerData(async () => "Title from route data", {
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
          `,
          "src/routes/title-from-error-boundary.tsx": js`
            import { Title, Meta } from 'solid-meta';
            import { createResource, ErrorBoundary } from 'solid-js';
  
            export default function TitleFromErrorBoundary() {
              const [data] = createResource(async () => {
                throw new Error('Error')
              }, {
                deferStream: true
              });
              return <>
                <ErrorBoundary fallback={e => <Title>{e.message}</Title>}>
                  <h1>No title</h1>
                  <Show when={data()}><Title>{data()}</Title></Show>
                  <Meta name="description" value="Should not be rendered" />
                </ErrorBoundary>
              </>;
            }`,
          "src/routes/title-from-suspense.tsx": js`
            import { Title, Meta } from 'solid-meta';
            import { createResource, ErrorBoundary } from 'solid-js';
  
            export default function TitleFromErrorBoundary() {
              const [data] = createResource(async () => {
                return "Hello world"
              }, {
                deferStream: true
              });
              return <>
                <Suspense fallback={() => (<>
                  <Title>Waiting</Title>
                  <Meta name="description" value="Should not be rendered" />
                </>)}>
                  <h1>No title</h1>
                  <Show when={data()}><Title>{data()}</Title></Show>
                </Suspense>
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

    runTests();
  });

  function runTests() {
    test("<meta charset='utf-8' /> in root add tag", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      expect(await app.getHtml('meta[charset="utf-8"]')).toBeTruthy();
    });

    test("<meta charset='utf-8' /> in root add tag in SSR", async ({ page }) => {
      let res = await fixture.requestDocument("/title-from-resource");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
      expect(selectHtml(await res.text(), 'meta[charset="utf-8"]')).toBe(
        prettyHtml(`<meta charset="utf-8" />`)
      );
    });

    test("<Title /> component adds a <title />", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/");

      expect(await app.getHtml("title")).toBeTruthy();
      await expect(page).toHaveTitle("Index page");
    });

    test("<Title /> component adds a <title /> in SSR", async () => {
      let res = await fixture.requestDocument("/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
      expect(selectHtml(await res.text(), "title")).toBe(
        prettyHtml(`<title data-sm="">Index page</title>`)
      );
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

    // test("with ErrorBoundary adds correct <title />, no <meta description /> in SSR", async () => {
    //   let res = await fixture.requestDocument("/title-from-error-boundary");
    //   expect(res.status).toBe(200);
    //   expect(res.headers.get("Content-Type")).toBe("text/html");
    //   let html = await res.text();
    //   expect(selectHtml(html, "title")).toBe(prettyHtml(`<title data-sm="">Error</title>`));
    //   expect(() => selectHtml(html, 'meta[name="description"]')).toThrow();
    // });

    test("with ErrorBoundary adds correct <title />, no <meta description />", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/title-from-error-boundary");

      expect(await app.getHtml("title")).toBeTruthy();
      await expect(page).toHaveTitle("Error");
      expect(app.getHtml('meta[name="description"]')).rejects.toThrow();
    });

    // test("with Suspense adds correct <title />, no <meta description /> in SSR", async () => {
    //   let res = await fixture.requestDocument("/title-from-suspense");
    //   expect(res.status).toBe(200);
    //   expect(res.headers.get("Content-Type")).toBe("text/html");
    //   let html = await res.text();
    //   expect(selectHtml(html, "title")).toBe(prettyHtml(`<title data-sm="">Hello world</title>`));
    //   expect(() => selectHtml(html, 'meta[name="description"]')).toThrow();
    // });

    test("with Suspense adds correct <title />, no <meta description />", async ({ page }) => {
      let app = new PlaywrightFixture(appFixture, page);
      await app.goto("/title-from-suspense");

      expect(await app.getHtml("title")).toBeTruthy();
      await expect(page).toHaveTitle("Hello world");
      expect(app.getHtml('meta[name="description"]')).rejects.toThrow();
    });
  }
});
