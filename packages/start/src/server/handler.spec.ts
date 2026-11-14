import { H3, HTTPError, type Middleware } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FetchEvent, StartHandler } from "./types.ts";

type APIHandler = (event: FetchEvent) => unknown;

const app = vi.hoisted(() => ({
  middleware: [] as Middleware[],
  GET: undefined as APIHandler | undefined,
}));

vi.mock("solid-start:middleware", () => ({
  get default() {
    return app.middleware;
  },
}));

vi.mock("./api-routes.ts", () => ({
  matchAPIRoute: (path: string) =>
    path === "/api" && app.GET
      ? { handler: { import: async () => ({ GET: app.GET }) }, isPage: false }
      : undefined,
}));

vi.mock("../router.tsx", () => ({ createRoutes: vi.fn() }));
vi.mock("../fns/handler.ts", () => ({ handleServerFunction: vi.fn() }));
vi.mock("./manifest/ssr-manifest.ts", () => ({ getSsrManifest: vi.fn() }));

const createHandler = async () => {
  const { createBaseHandler } = await import("./handler.ts");
  return createBaseHandler(vi.fn(), vi.fn());
};

const request = (search = "") => new Request(`http://localhost/api${search}`);

const throwing = (thrown: unknown) => () => {
  throw thrown;
};

beforeEach(() => {
  vi.resetModules();
  app.middleware = [];
  app.GET = undefined;
});

describe("createBaseHandler", () => {
  it("answers with what an API route returns", async () => {
    app.GET = () => new Response("ok");
    const handler = await createHandler();

    const response = await handler.fetch(request());

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
  });

  it("answers an HTTPError that an API route throws", async () => {
    app.GET = throwing(new HTTPError({ status: 418, message: "teapot" }));
    const handler = await createHandler();

    const response = await handler.fetch(request());

    expect(response.status).toBe(418);
    expect(await response.json()).toMatchObject({ message: "teapot" });
  });

  it("answers an HTTPError that middleware throws", async () => {
    app.middleware = [throwing(new HTTPError({ status: 401, message: "sign in" }))];
    const handler = await createHandler();

    const response = await handler.fetch(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ message: "sign in" });
  });

  it("answers a status thrown as a number", async () => {
    app.GET = throwing(404);
    const handler = await createHandler();

    const response = await handler.fetch(request());

    expect(response.status).toBe(404);
  });

  it.each([
    ["not-found", "h3.notFound", 404],
    ["handled", "h3.handled", 200],
  ])("answers h3's %s marker as h3 does", async (_, key, status) => {
    app.GET = throwing(Symbol.for(key));
    const handler = await createHandler();

    const response = await handler.fetch(request());

    expect(response.status).toBe(status);
  });

  it("answers with what middleware returns for an error it catches", async () => {
    app.GET = throwing(new Error("thrown by an API route"));
    app.middleware = [
      async (_event, next) => {
        try {
          return await next();
        } catch {
          return new Response("caught", { status: 503 });
        }
      },
    ];
    const handler = await createHandler();

    const response = await handler.fetch(request());

    expect(response.status).toBe(503);
    expect(await response.text()).toBe("caught");
  });

  describe("unhandled errors", () => {
    it("leaves an error that an API route throws to the server hosting the handler", async () => {
      const error = new Error("thrown by an API route");
      app.GET = throwing(error);
      const handler = await createHandler();

      await expect(handler.fetch(request())).rejects.toBe(error);
    });

    it("leaves an error that middleware throws to the server hosting the handler", async () => {
      const error = new Error("thrown by middleware");
      app.middleware = [throwing(error)];
      const handler = await createHandler();

      await expect(handler.fetch(request())).rejects.toBe(error);
    });

    it.each([
      ["a string", "thrown by an API route"],
      ["undefined", undefined],
    ])("leaves %s, as h3 would answer it, to the server hosting the handler", async (_, thrown) => {
      app.GET = throwing(thrown);
      const handler = await createHandler();

      const error = await handler.fetch(request()).then(
        () => expect.unreachable(),
        (error: unknown) => error,
      );

      expect(HTTPError.isError(error)).toBe(true);
      expect(error).toMatchObject({ status: 500, unhandled: true, cause: thrown });
    });

    it("answers it through request(), as h3 does", async () => {
      app.GET = throwing(new Error("thrown by an API route"));
      const handler = await createHandler();

      const response = await handler.request("/api");

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ status: 500, unhandled: true });
    });

    it("leaves it to an h3 app the handler is mounted in", async () => {
      const error = new Error("thrown by an API route");
      app.GET = throwing(error);
      const onError = vi.fn();
      const outer = new H3({ onError });
      outer.mount("", await createHandler());

      const response = await outer.fetch(request());

      expect(response.status).toBe(500);
      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0]![0].cause).toBe(error);
    });

    it("leaves an HTTPError marked as unhandled to the server hosting the handler", async () => {
      const error = new HTTPError({ status: 500, unhandled: true });
      app.GET = throwing(error);
      const handler = await createHandler();

      await expect(handler.fetch(request())).rejects.toBe(error);
    });

    it("leaves another library's HTTPError, as an unhandled 500, to the server hosting the handler", async () => {
      // As ky and got name theirs
      class LibraryHTTPError extends Error {
        override name = "HTTPError";
      }
      const thrown = new LibraryHTTPError("Request failed with status code 502");
      app.GET = throwing(thrown);
      const handler = await createHandler();

      const error = await handler.fetch(request()).then(
        () => expect.unreachable(),
        (error: unknown) => error,
      );

      expect(error).not.toBe(thrown);
      expect(error).toMatchObject({
        status: 500,
        unhandled: true,
        cause: thrown,
        message: "Request failed with status code 502",
      });
      expect((error as Error).stack).toBe(thrown.stack);
    });

    it.each([
      ["different requests", () => [request("?1"), request("?2")]],
      ["one request", () => Array(2).fill(request())],
    ])("rejects only the call whose handler threw, for two calls with %s", async (_, requests) => {
      const error = new Error("thrown by an API route");
      let release!: () => void;
      const released = new Promise<void>(resolve => (release = resolve));
      let calls = 0;
      app.GET = async () => {
        // The first call throws once the second one has been answered.
        if (++calls > 1) return new Response("ok");
        await released;
        throw error;
      };
      const handler = await createHandler();

      const settled = requests().map((req: Request) => handler.fetch(req));
      await Promise.race(settled);
      release();
      const outcomes = await Promise.allSettled(settled);

      expect(outcomes.filter(outcome => outcome.status === "rejected")).toEqual([
        { status: "rejected", reason: error },
      ]);
      const [answered] = outcomes.filter(outcome => outcome.status === "fulfilled");
      expect(await answered!.value.text()).toBe("ok");
    });

    it("answers an error of a request() made during a call, as h3 does", async () => {
      app.GET = throwing(new Error("thrown by an API route"));
      let handler!: StartHandler;
      let depth = 0;
      app.middleware = [
        async (event, next) => {
          if (depth++ > 0) return next();
          // The same request, handled again while the call runs
          return handler.request(event.req);
        },
      ];
      handler = await createHandler();

      const response = await handler.fetch(request());

      expect(response.status).toBe(500);
      expect(await response.json()).toMatchObject({ status: 500, unhandled: true });
    });

    it("leaves its own error to the server after a hook made another request() first", async () => {
      const error = new Error("thrown by an API route");
      app.GET = event => {
        if (new URL(event.request.url).searchParams.has("nested")) return new Response("nested");
        throw error;
      };
      const handler = await createHandler();
      let nested = 0;
      handler.config.onRequest = async () => {
        if (nested++ === 0) await handler.request("/api?nested");
      };

      await expect(handler.fetch(request())).rejects.toBe(error);
    });

    it("lets middleware recover an error of another handler it enters through `handler`", async () => {
      app.GET = throwing(new Error("thrown by an API route"));
      const inner = await createHandler();
      app.middleware = [
        async (_event, next) => {
          try {
            return await next();
          } catch {
            return new Response("recovered");
          }
        },
        event => inner.handler(event),
      ];
      const handler = await createHandler();

      const response = await handler.fetch(request());

      expect(await response.text()).toBe("recovered");
    });

    it("answers the next request", async () => {
      app.GET = throwing(new Error("thrown by an API route"));
      const handler = await createHandler();
      await expect(handler.fetch(request())).rejects.toThrow();

      app.GET = () => new Response("ok");
      const response = await handler.fetch(request());

      expect(await response.text()).toBe("ok");
    });
  });
});
