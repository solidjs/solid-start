import { expect, test } from "@playwright/test";

import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createAppFixture, createFixture, css, js } from "./helpers/create-fixture.js";
import { getElement } from "./helpers/playwright-fixture.js";

test.describe("CSS link tags", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.describe("without streaming", () => {
    test.beforeAll(async () => {
      fixture = await createFixture({
        files: {
          "src/routes/index.css": css`
            h1 {
              color: brown;
            }
          `,
          "src/routes/index.tsx": js`
            import { Outlet } from "solid-app-router";
            import "./index.css";
            export default function Index() {
              return <>
                <h1>Index</h1>
                <Outlet/>
              </>;
            }
          `,
          "src/routes/index/index-index.css": css`
            p {
              background-color: red;
            }
          `,
          "src/routes/index/index.tsx": js`
            import "./index-index.css";
            export default function IndexIndex() {
              return <p>Index Index</p>;
            }
          `,
          "src/routes/index/index-non-index.css": css`
            span {
              padding-left: 5px;
            }
          `,
          "src/routes/index/non-index.tsx": js`
            import "./index-non-index.css";
            export default function IndexNonIndex() {
              return <span>Index Non-Index</span>;
            }
          `,
          "src/routes/nested-route.css": css`
            h2 {
              color: blue;
            }
          `,
          "src/routes/nested-route.tsx": js`
            import { Outlet } from "solid-app-router";
            import "./nested-route.css";
            export default function NestedRoute() {
              return <>
                <h2>Nested Route</h2>
                <Outlet/>
              </>;
            }
          `,
          "src/routes/nested-route/nested-route-index.css": css`
            p {
              background-color: pink;
            }
          `,
          "src/routes/nested-route/index.tsx": js`
            import "./nested-route-index.css";
            export default function NestedRouteIndex() {
              return <p>Nested Route Index</p>;
            }
          `,
          "src/routes/nested-route/nested-route-non-index.css": css`
            span {
              padding-right: 5px;
            }
          `,
          "src/routes/nested-route/non-index.tsx": js`
            import "./nested-route-non-index.css";
            export default function NestedRouteNonIndex() {
              return <span>Nested Route Non-Index</span>;
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
    test("Index of index nested route", async () => {
      const res = await fixture.requestDocument("/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
      const html = await res.text();
      expect(getElement(html, 'link[rel="stylesheet"][href^="/assets/index."]')).toBeTruthy();
      expect(getElement(html, 'link[rel="stylesheet"][href^="/assets/index-index."]')).toBeTruthy();
    });

    test("Non-index of index nested route", async () => {
      const res = await fixture.requestDocument("/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
      const html = await res.text();
      expect(getElement(html, 'link[rel="stylesheet"][href^="/assets/index."]')).toBeTruthy();
      expect(
        getElement(html, 'link[rel="stylesheet"][href^="/assets/index-non-index."]')
      ).toBeTruthy();
    });

    test("Index of nested route", async () => {
      const res = await fixture.requestDocument("/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
      const html = await res.text();
      expect(
        getElement(html, 'link[rel="stylesheet"][href^="/assets/nested-route."]')
      ).toBeTruthy();
      expect(
        getElement(html, 'link[rel="stylesheet"][href^="/assets/nested-route-index."]')
      ).toBeTruthy();
    });

    test("Non-index of nested route", async () => {
      const res = await fixture.requestDocument("/");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/html");
      const html = await res.text();
      expect(
        getElement(html, 'link[rel="stylesheet"][href^="/assets/nested-route."]')
      ).toBeTruthy();
      expect(
        getElement(html, 'link[rel="stylesheet"][href^="/assets/nested-route-non-index."]')
      ).toBeTruthy();
    });
  }
});
