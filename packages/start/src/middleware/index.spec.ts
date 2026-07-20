import { setTimeout } from "node:timers/promises";
import { defineHandler, H3, type Middleware } from "h3";
import { describe, expect, it, vi } from "vitest";

import { createMiddleware } from "./index.ts";

vi.mock("server-only", () => ({}));

const createApp = (middleware: Middleware[]) => {
  const app = new H3();
  app.use(defineHandler({ middleware, handler: () => "ok" }));
  return app;
};

describe("createMiddleware", () => {
  it("runs onRequest middleware in declared order", async () => {
    const calls: string[] = [];
    const app = createApp(
      createMiddleware({
        onRequest: [
          async () => {
            calls.push("one");
            await setTimeout(5);
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
            await setTimeout(5);
          },
          async () => {
            calls.push("two");
            await setTimeout(5);
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

  it("passes replacement responses to later onBeforeResponse middleware", async () => {
    const app = createApp(
      createMiddleware({
        onBeforeResponse: [
          () => new Response("one"),
          async (_event, response) => {
            expect(response.body).toBeInstanceOf(Response);
            return new Response(`${await (response.body as Response).text()} two`);
          },
        ],
      }),
    );

    const res = await app.fetch(new Request("http://localhost/"));

    expect(await res.text()).toBe("one two");
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
        onBeforeResponse: () => new Response("replaced", { status: 418 }),
      }),
    );

    const res = await app.fetch(new Request("http://localhost/"));

    expect(res.status).toBe(418);
    expect(await res.text()).toBe("replaced");
  });

  it("passes through an array of H3 middleware", () => {
    const middleware: Middleware[] = [async (_event, next) => next()];

    expect(createMiddleware(middleware)).toBe(middleware);
  });
});
