import { test, expect } from "@playwright/test";

import { createFixture, js } from "./helpers/create-fixture.js";
import type { Fixture } from "./helpers/create-fixture.js";

test.describe("loader", () => {
  let fixture: Fixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/index.tsx": js`
        
          export default function Index() {
            return <div>Hello World</div>;
          }
        `
      }
    });
  });

  test("returns responses for a specific route", async () => {
    let root = await fixture.requestDocument("/");

    expect(root.headers.get("Content-Type")).toBe("text/html");
  });
});
