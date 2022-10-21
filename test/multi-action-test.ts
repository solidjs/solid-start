import { expect, test } from "@playwright/test";

import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("multi actions", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.skip(process.env.START_ADAPTER !== "solid-start-node");

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/multi-action.tsx": js`
        import { For } from "solid-js";
        import { FormError, parseCookie } from "solid-start";
        import { createServerMultiAction$ } from "solid-start/server";

        const STANDARD_RESPONSE_DELAY = 500;
        
        export default () => {
          const [data, trigger] = createServerMultiAction$(async (_, event) => {
            const cookies = parseCookie(event.request.headers.get("cookie") ?? "");
            const delay = Number(cookies["delay"] ?? STANDARD_RESPONSE_DELAY);
            const shouldError = cookies["state"] === "error";

            await new Promise<void>((res) => setTimeout(res, delay));

            if (shouldError) throw new FormError("error");

            return "success";
          });

          return (
            <div>
              <div>
                <button id="submit" onClick={() => trigger()}>Submit</button>
                <For each={data}>
                  {(object, index) => (
                    <div id={"request-" + index()}>
                      <span>
                        {() =>
                          object.result
                            ? object.result
                            : object.error
                            ? "error"
                            : "pending"
                        }
                      </span>{" "}
                      <button onClick={object.retry}>retry</button>
                    </div>
                  )}
                </For>
              </div>
            </div>
          );
        };
        `
      }
    });

    appFixture = await fixture.createServer();
  });

  test.beforeEach(async ({ context }) => {
    context.clearCookies();
  });

  test.afterAll(async () => {
    await appFixture.close();
  });

  test("multi action resulting with success", async ({ page }) => {
    const app = new PlaywrightFixture(appFixture, page);

    await app.goto("/multi-action", true);
    await page.click("button#submit");
    await expect(page.locator("#request-0")).toContainText("success");
    await page.click("button#submit");
    await expect(page.locator("#request-1")).toContainText("success");
  });

  test("multi action resulting with error", async ({ page, context }) => {
    const app = new PlaywrightFixture(appFixture, page);

    await app.goto("/multi-action", true);

    context.addCookies([{ name: "state", value: "error", url: page.url() }]);

    await page.click("button#submit");
    await expect(page.locator("#request-0")).toContainText("error");
    await page.click("button#submit");
    await expect(page.locator("#request-1")).toContainText("error");
  });

  test("multi action retrying", async ({ page, context }) => {
    const app = new PlaywrightFixture(appFixture, page);

    await app.goto("/multi-action", true);

    await context.addCookies([{ name: "state", value: "error", url: page.url() }]);

    await page.click("button#submit");
    await expect(page.locator("#request-0")).toContainText("error");
    await page.click("button#submit");
    await expect(page.locator("#request-1")).toContainText("error");

    await context.clearCookies();

    await page.click("#request-0 button");
    await expect(page.locator("#request-0")).toContainText("success");
    await page.click("#request-1 button");
    await expect(page.locator("#request-1")).toContainText("success");
  });

  test("multi action pending state", async ({ page }) => {
    const app = new PlaywrightFixture(appFixture, page);

    await app.goto("/multi-action", true);
    await page.click("button#submit");

    await expect(page.locator("#request-0")).toContainText("pending");
    await expect(page.locator("#request-0")).toContainText("success");

    await page.click("button#submit");

    await expect(page.locator("#request-1")).toContainText("pending");
    await expect(page.locator("#request-1")).toContainText("success");
  });

  test("multi action concurrent submissions with responses out of order", async ({
    page,
    context
  }) => {
    const app = new PlaywrightFixture(appFixture, page);

    await app.goto("/multi-action", true);

    await context.addCookies([{ name: "delay", value: "1000", url: page.url() }]);
    await page.click("button#submit");
    await context.addCookies([{ name: "delay", value: "500", url: page.url() }]);
    await page.click("button#submit");
    await context.addCookies([{ name: "delay", value: "250", url: page.url() }]);
    await page.click("button#submit");

    await expect(page.locator("#request-0")).toContainText("pending");
    await expect(page.locator("#request-1")).toContainText("pending");
    await expect(page.locator("#request-2")).toContainText("pending");

    await expect(page.locator("#request-0")).toContainText("pending");
    await expect(page.locator("#request-1")).toContainText("pending");
    await expect(page.locator("#request-2")).toContainText("success");

    await expect(page.locator("#request-0")).toContainText("pending");
    await expect(page.locator("#request-1")).toContainText("success");
    await expect(page.locator("#request-2")).toContainText("success");

    await expect(page.locator("#request-0")).toContainText("success");
    await expect(page.locator("#request-1")).toContainText("success");
    await expect(page.locator("#request-2")).toContainText("success");
  });

  test("multi action concurrent retries with responses out of order", async ({ page, context }) => {
    const app = new PlaywrightFixture(appFixture, page);

    await app.goto("/multi-action", true);
    await page.click("button#submit");

    await context.addCookies([
      { name: "delay", value: "500", url: page.url() },
      { name: "state", value: "error", url: page.url() }
    ]);
    await page.click("#request-0 button");

    await context.addCookies([
      { name: "delay", value: "250", url: page.url() },
      { name: "state", value: "success", url: page.url() }
    ]);
    await page.click("#request-0 button");
    await page.waitForResponse(response => response.status() !== 200);

    await expect(page.locator("#request-0")).toContainText("success");
  });
});
