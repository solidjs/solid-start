import { expect, test } from "@playwright/test";

import cheerio from "cheerio";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createFixture, css, js } from "./helpers/create-fixture.js";
import { getElement } from "./helpers/playwright-fixture.js";

test.describe("CSS link tags", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;
  test.skip(process.env.START_ADAPTER !== "solid-start-node");

  test.describe("without streaming", () => {
    test.beforeAll(async () => {
      const files = {};

      const camelize = name => name.replace(/-./g, x => x[1].toUpperCase());
      const pascalize = name => {
        name = name.replace(/[\[\]\.\(\)]/g, "");
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
          import { Outlet } from "solid-start";
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
        import {
          Body,
          ErrorBoundary,
          FileRoutes,
          Head,
          Html,
          Routes,
          Scripts
        } from "solid-start";
        import { Suspense } from "solid-js";

        import "./root.css";

        export default function Root() {
          return (
            <Html lang="en">
              <Head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
              </Head>
              <Body>
                <ErrorBoundary>
                  <Suspense>
                    <Routes>
                      <FileRoutes />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
                <Scripts />
              </Body>
            </Html>
          );
        }
      `;

      createNestedRoute("(auth)", ["login", "[...wild]"]);
      createNestedRoute("nested");
      createNestedRoute("[param]");
      createNestedRoute("nested/(pathless)", ["test"]);
      createNestedRoute("nested/double-nested");
      createNestedRoute("nested/double-nested/triple-nested");

      fixture = await createFixture({
        files
      });

      appFixture = await fixture.createServer();
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
    return (x: string) =>
      new RegExp(
        `^/assets/${name
          .replace("[", "\\[")
          .replace("]", "\\]")
          .replace("(", "\\(")
          .replace(")", "\\)")}\[\.\-][a-f0-9]+\.css$`
      ).test(x);
  }

  function expectNumberOfUrlsToMatch(urls: string[], matchName: string, expectedNumber: number) {
    return expect(urls.filter(matchHashedCssFile(matchName))).toHaveLength(expectedNumber);
  }

  function runTests() {
    test("Pathless layout route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/login", 3);
      expectNumberOfUrlsToMatch(cssUrls, "(auth)", 1);
      expectNumberOfUrlsToMatch(cssUrls, "login", 1);
    });
    test("Pathless layout wildcard route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/2/3", 3);
      expectNumberOfUrlsToMatch(cssUrls, "(auth)", 1);
      expectNumberOfUrlsToMatch(cssUrls, "_...wild_", 1);
    });
    test("Index of nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/nested", 3);
      expectNumberOfUrlsToMatch(cssUrls, "nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "index", 1);
    });
    test("Non-index nested route containing the word index", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/nested/non-index", 3);
      expectNumberOfUrlsToMatch(cssUrls, "nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "non-index", 1);
    });
    test("Index of dynamic nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/(auth)", 3);
      expectNumberOfUrlsToMatch(cssUrls, "_param_", 1);
      expectNumberOfUrlsToMatch(cssUrls, "index", 1);
    });
    test("Non-index of dynamic nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/(auth)/non-index", 3);
      expectNumberOfUrlsToMatch(cssUrls, "_param_", 1);
      expectNumberOfUrlsToMatch(cssUrls, "non-index", 1);
    });
    test("Pathless layout inside a nested route", async () => {
      const cssUrls = await getStylesheetUrlsForRoute("/nested/test", 4);
      expectNumberOfUrlsToMatch(cssUrls, "nested", 1);
      expectNumberOfUrlsToMatch(cssUrls, "(pathless)", 1);
      expectNumberOfUrlsToMatch(cssUrls, "test", 1);
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
