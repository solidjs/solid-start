import { defineHandler, H3, type Middleware } from "h3";
import { describe, expect, it } from "vitest";

import { createMiddleware } from "./index.ts";

const createApp = (middleware: Middleware[]) => {
  const app = new H3();
  app.use(defineHandler({ middleware, handler: () => "ok" }));
  return app;
};

const delay = () => new Promise(resolve => setTimeout(resolve, 5));

describe("createMiddleware", () => {
  it("runs onRequest middleware in declared order", async () => {
    const calls: string[] = [];
    const app = createApp(
      createMiddleware({
        onRequest: [
          async () => {
            calls.push("one");
            await delay();
          },
          () => {
            calls.push("two");
          },
        ],
      }),
    );

    await app.fetch(new Request("http://localhost/"));

    expect(calls).toEqual(["one", "two"]);
  });

  // https://github.com/solidjs/solid-start/issues/2131
  it("runs onBeforeResponse middleware in declared order", async () => {
    const calls: string[] = [];
    const app = createApp(
      createMiddleware({
        onBeforeResponse: [
          async () => {
            calls.push("one");
            await delay();
          },
          async () => {
            calls.push("two");
            await delay();
          },
          () => {
            calls.push("three");
          },
        ],
      }),
    );

    await app.fetch(new Request("http://localhost/"));

    expect(calls).toEqual(["one", "two", "three"]);
  });

  it("runs onRequest before the handler and onBeforeResponse after", async () => {
    const calls: string[] = [];
    const app = new H3();
    app.use(
      defineHandler({
        middleware: createMiddleware({
          onRequest: [() => void calls.push("request")],
          onBeforeResponse: [() => void calls.push("response")],
        }),
        handler: () => {
          calls.push("handler");
          return "ok";
        },
      }),
    );

    await app.fetch(new Request("http://localhost/"));

    expect(calls).toEqual(["request", "handler", "response"]);
  });

  it("lets an onBeforeResponse middleware replace the response", async () => {
    const app = createApp(
      createMiddleware({
        onBeforeResponse: [() => new Response("replaced", { status: 418 })],
      }),
    );

    const res = await app.fetch(new Request("http://localhost/"));

    expect(res.status).toBe(418);
    expect(await res.text()).toBe("replaced");
  });
});
