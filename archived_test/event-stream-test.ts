import { expect, test } from "@playwright/test";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { createFixture, js } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("check event-stream", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.skip(process.env.START_ADAPTER !== "solid-start-node");

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/index.jsx": js`
          import { createEffect, createSignal, onCleanup, Show } from "solid-js";
          import server$, { eventStream } from "solid-start/server";
          
          function createEventStream({ url }, onMessage) {
            createEffect(() => {
              const eventSource = new EventSource(url);
          
              eventSource.addEventListener("chat", (event) => {
                onMessage(event);
              });
          
              onCleanup(() => eventSource.close());
            });
          }
          
          export default function Page(){
            let [state, setState] = createSignal('test data');
            createEventStream(
              server$(async () =>
                eventStream(server$.request, (send) => {
                  send("chat", "Hello world");
                  setTimeout(() => {
                    send("chat", "Goodbye");
                  }, 5000);
                  return () => {};
                })
              ),
              (event) => {
                setState(event.data);
              }
            );
          
            return <h1 id="chat">{state()}</h1>;
          };
        `
      }
    });

    appFixture = await fixture.createServer();
  });

  test("should change the inner text of the h1 element when receiving data from the event stream", async ({
    page
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    await page.waitForTimeout(500);

    expect(await page.locator("#chat").innerText()).toBe("Hello world");

    await page.waitForTimeout(6000);

    expect(await page.locator("#chat").innerText()).toBe("Goodbye");
  });
});
