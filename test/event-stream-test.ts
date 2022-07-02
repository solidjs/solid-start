import { test } from "@playwright/test";
import { createAppFixture, createFixture, js } from "./helpers/create-fixture.js";
import type { AppFixture, Fixture } from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test.describe("check event stream", () => {
  let fixture: Fixture;
  let appFixture: AppFixture;

  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "src/routes/index.jsx": js`
        import { createEffect, createSignal, onCleanup, Show } from "solid-js";
        import server from "solid-start/server";
        
        function createEventStream({ url }, onMessage) {
          createEffect(() => {
            const eventSource = new EventSource(url);
        
            eventSource.addEventListener("chat", (event) => {
              onMessage(event);
            });
        
            onCleanup(() => eventSource.close());
          });
        }
        
        function eventStream(request, init) {
          let stream = new ReadableStream({
            start(controller) {
              let encoder = new TextEncoder();
              let send = (event, data) => {
                controller.enqueue(encoder.encode("event: " + event + "\n"));
                controller.enqueue(encoder.encode("data: " + data + "\n" + "\n"));
              };
              let cleanup = init(send);
              let closed = false;
              let close = () => {
                if (closed) return;
                cleanup();
                closed = true;
                request.signal.removeEventListener("abort", close);
                controller.close();
              };
              request.signal.addEventListener("abort", close);
              if (request.signal.aborted) {
                close();
                return;
              }
            },
          });
          return new Response(stream, {
            headers: { "Content-Type": "text/event-stream" },
          });
        }
        
        export default () => {
          let ref;
          const [chat, setChat] = createSignal("");
          createEventStream(
            server(async () =>
              eventStream(server.request, (send) => {
                send("chat", "Hello world");
                setTimeout(() => {
                  send("chat", "Goodbye");
                }, 5000);
                return () => {};
              })
            ),
            (event) => {
              ref.innerText = event.data;
            }
          );
        
          return <h1 ref={ref} id="chat" data-testid="chat"></h1>;
        };
        
        `
      }
    });

    appFixture = await createAppFixture(fixture);
  });

  test("chat should change change when receiving data from the event stream", async ({ page }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/");

    const element = page.locator("#chat");

    const text = await element.innerText();

    console.log({ text });
  });
});
