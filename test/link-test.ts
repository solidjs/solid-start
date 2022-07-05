import { expect, test } from "@playwright/test";

import cheerio from "cheerio";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createAppFixture, createFixture, css, js } from "./helpers/create-fixture.js";
import { getElement } from "./helpers/playwright-fixture.js";

test.describe("CSS link tags", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.describe("without streaming", () => {
    test.beforeAll(async () => {
      const files = {};

      const camelize = name => name.replace(/-./g, x => x[1].toUpperCase());
      const pascalize = name => {
        const cc = camelize(name);
        return cc[0].toUpperCase() + cc.slice(1);
      };

      function createNestedRoute(path: string, children = ["index", "non-index"]) {
        const name = path.split("/").pop()!;
        const pascalCaseName = pascalize(name);

        const createChildRoute = childName => {
          const childPascalCaseName = pascalize(childName);
          files[`src/routes/${path}/${childName}.css`] = css`
            p::before {
              content: "${path}-${childName}";
            }
          `;
          files[`src/routes/${path}/${childName}.tsx`] = js`
            import "./${childName}.css";
            export default function ${pascalCaseName}${childPascalCaseName}() {
              return <p>${pascalCaseName} ${childPascalCaseName}</p>;
            }
          `;
        };

        files[`src/routes/${path}.css`] = css`
          h1::before {
            content: "${path}";
          }
        `;
        files[`src/routes/${path}.tsx`] = js`
          import { Outlet } from "solid-app-router";
          import "./${name}.css";
          export default function ${pascalCaseName}() {
            return <>
              <h1>${pascalCaseName}</h1>
              <Outlet/>
            </>;
          }
        `;

        children.forEach(childName => {
          createChildRoute(childName);
        });
      }

      files["src/root.css"] = css`
        body::before {
          content: "root";
        }
      `;

      files["src/root.tsx"] = js`
        // @refresh reload
        import { Links, Meta, FileRoutes, Scripts } from "solid-start/root";
        import { ErrorBoundary } from "solid-start/error-boundary";
        import { Suspense } from "solid-js";
        import { Routes } from "solid-app-router";

        import "./root.css";

        export default function Root() {
          return (
            <html lang="en">
              <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
              </head>
              <body>
                <ErrorBoundary>
                  <Suspense>
                    <Routes>
                      <FileRoutes />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
                <Scripts />
              </body>
            </html>
          );
        }
      `;

      createNestedRoute("index");
      createNestedRoute("index/double-nested");
      createNestedRoute("nested");
      createNestedRoute("nested/double-nested");
      createNestedRoute("nested/double-nested/triple-nested");

      fixture = await createFixture({
        files
      });

      appFixture = await createAppFixture(fixture);
    });

    test.afterAll(async () => {
      await appFixture.close();
    });

    runTests();
  });

  async function getStylesheetUrlsForRoute(route: string, expectedNumberOfStylesheets: number) {
    const res = await fixture.requestDocument(route);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    const html = await res.text();
    const cssLinkTags = getElement(html, 'link[rel="stylesheet"]');
    const cssUrls = cssLinkTags
      .map((_, el) => {
        return cheerio(el).attr("href");
      })
      .toArray();

    expectNumberOfUrlsToMatch(cssUrls, "entry-client", 1);
    expect(cssUrls).toHaveLength(expectedNumberOfStylesheets);

    return [...new Set(cssUrls)];
  }

  function matchHashedCssFile(name: string) {
    return (x: string) => new RegExp(`^/assets/${name}\\.[a-f0-9]+\.css$`).test(x);
  }

  function expectNumberOfUrlsToMatch(urls: string[], matchName: string, expectedNumber: number) {
    return expect(urls.filter(matchHashedCssFile(matchName))).toHaveLength(expectedNumber);
  }

  function runTests() {
    test("Index of index nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/", 3);
      expectNumberOfUrlsToMatch(cssUrls, "index", 2);
    });
    test("Non-index of index nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/non-index", 3);
      expectNumberOfUrlsToMatch(cssUrls, "index", 1);
      expectNumberOfUrlsToMatch(cssUrls, "non-index", 1);
    });
    test("Index of double index nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/double-nested", 4);
      expectNumberOfUrlsToMatch(cssUrls, "index", 2);
      expectNumberOfUrlsToMatch(cssUrls, "double-nested", 1);
    });
    test("Non-index of double index nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/double-nested/non-index", 4);
      expectNumberOfUrlsToMatch(cssUrls, "index", 1);
      expectNumberOfUrlsToMatch(cssUrls, "double-nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "non-index", 1);
    });
    test("Index of nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/nested", 3);
      expectNumberOfUrlsToMatch(cssUrls, "nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "index", 1);
    });
    test("Non-index of nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/nested/non-index", 3);
      expectNumberOfUrlsToMatch(cssUrls, "nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "non-index", 1);
    });
    test("Index of double nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/nested/double-nested", 4);
      expectNumberOfUrlsToMatch(cssUrls, "nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "double-nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "index", 1);
    });
    test("Non-index of double nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/nested/double-nested/non-index", 4);
      expectNumberOfUrlsToMatch(cssUrls, "nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "double-nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "non-index", 1);
    });
    test("Index of triple nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/nested/double-nested/triple-nested", 5);
      expectNumberOfUrlsToMatch(cssUrls, "nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "double-nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "triple-nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "index", 1);
    });
    test("Non-index of triple nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute(
        "/nested/double-nested/triple-nested/non-index",
        5
      );
      expectNumberOfUrlsToMatch(cssUrls, "nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "double-nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "triple-nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "non-index", 1);
    });
  }
});
