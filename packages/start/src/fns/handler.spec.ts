import { describe, expect, it, vi, beforeEach } from "vitest";
import { parseCookies } from "h3";
import type { FetchEvent } from "../server/types.ts";
import { getFetchEvent } from "../server/fetchEvent.ts";
import { getServerFunction } from "./registration.ts";

vi.mock("h3", () => ({
  parseCookies: vi.fn(() => ({})),
}));

vi.mock("solid-js/web", () => ({
  renderToString: vi.fn(),
}));

vi.mock("solid-js/web/storage", () => ({
  provideRequestEvent: vi.fn((_event, fn) => fn()),
}));

vi.mock("solid-start:server-fn-manifest", () => ({}));

const configuredErrorHandler = vi.hoisted(() => ({
  current: undefined as ((thrown: unknown) => unknown) | undefined,
}));

vi.mock("solid-start:server-fn-error-handler", () => ({
  get default() {
    return configuredErrorHandler.current;
  },
}));

vi.mock("../server/handler.ts", () => ({
  createPageEvent: vi.fn(),
}));

vi.mock("../server/fetchEvent.ts", () => ({
  getFetchEvent: vi.fn(),
  mergeResponseHeaders: vi.fn(),
}));

vi.mock("./registration.ts", () => ({
  getServerFunction: vi.fn(),
  hasServerFunction: vi.fn(() => true),
}));

vi.mock("./serialization.ts", () => ({
  serializeToJSONStream: vi.fn(() => "serialized"),
  serializeToJSStream: vi.fn(() => "serialized"),
}));

function createMockFetchEvent(
  headers: Record<string, string> = {},
  setCookies: string[] = [],
): FetchEvent {
  return {
    request: new Request("http://localhost/test", { headers }),
    response: {
      headers: {
        getSetCookie: () => [...setCookies],
      },
    },
    nativeEvent: {},
    locals: {},
  } as FetchEvent;
}

describe("createSingleFlightHeaders", () => {
  let createSingleFlightHeaders: (sourceEvent: FetchEvent, result?: unknown) => Headers;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(parseCookies).mockReturnValue({});
    const module = await import("./handler.ts");
    createSingleFlightHeaders = module.createSingleFlightHeaders;
  });

  it("should create a new Headers object instead of returning the original", () => {
    const sourceEvent = createMockFetchEvent({
      "content-type": "application/json",
    });

    const result = createSingleFlightHeaders(sourceEvent);

    expect(result).not.toBe(sourceEvent.request.headers);
  });

  it("should not mutate the original request headers", () => {
    const originalHeaders = new Headers({
      "content-type": "application/json",
      cookie: "session=abc123",
      "cf-ray": "abc123",
      "cf-cache-status": "HIT",
    });
    const sourceEvent: FetchEvent = {
      request: new Request("http://localhost/test", { headers: originalHeaders }),
      response: {
        headers: {
          getSetCookie: () => [],
        },
      },
      nativeEvent: {},
      locals: {},
    } as FetchEvent;

    const originalCookieHeader = sourceEvent.request.headers.get("cookie");
    const originalCfRay = sourceEvent.request.headers.get("cf-ray");

    createSingleFlightHeaders(sourceEvent);

    expect(sourceEvent.request.headers.get("cookie")).toBe(originalCookieHeader);
    expect(sourceEvent.request.headers.get("cf-ray")).toBe(originalCfRay);
  });

  it("should apply cookies set on the event response", () => {
    const sourceEvent = createMockFetchEvent({}, [
      "val=1234; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600",
    ]);

    const result = createSingleFlightHeaders(sourceEvent);

    expect(result.get("cookie")).toBe("val=1234");
  });

  it("should apply cookies set on a thrown redirect response", () => {
    const sourceEvent = createMockFetchEvent();
    const redirect = new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": "val=1234; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600",
      },
    });

    const result = createSingleFlightHeaders(sourceEvent, redirect);

    expect(result.get("cookie")).toBe("val=1234");
  });

  it("should let response cookies win over ones already on the request", () => {
    vi.mocked(parseCookies).mockReturnValue({ session: "old" });
    const sourceEvent = createMockFetchEvent({ cookie: "session=old" });
    const redirect = new Response(null, {
      status: 302,
      headers: { "Set-Cookie": "session=new; Path=/" },
    });

    const result = createSingleFlightHeaders(sourceEvent, redirect);

    expect(result.get("cookie")).toBe("session=new");
  });

  it("should remove cookies cleared by the response", () => {
    vi.mocked(parseCookies).mockReturnValue({ session: "abc123" });
    const sourceEvent = createMockFetchEvent({ cookie: "session=abc123" });
    const redirect = new Response(null, {
      status: 302,
      headers: { "Set-Cookie": "session=; Path=/; Max-Age=0" },
    });

    const result = createSingleFlightHeaders(sourceEvent, redirect);

    expect(result.get("cookie")).toBe(null);
  });

  it("should not copy non-cookie response headers onto the request", () => {
    const sourceEvent = createMockFetchEvent();
    const redirect = new Response(null, {
      status: 302,
      headers: { Location: "/", "X-Revalidate": "user" },
    });

    const result = createSingleFlightHeaders(sourceEvent, redirect);

    expect(result.get("location")).toBe(null);
    expect(result.get("x-revalidate")).toBe(null);
  });

  it("should ignore non-Response results", () => {
    const sourceEvent = createMockFetchEvent();

    expect(() => createSingleFlightHeaders(sourceEvent, { some: "value" })).not.toThrow();
  });
});

describe("the configured server function error handler", () => {
  const callThrowing = async (thrown: unknown) => {
    const request = new Request("http://localhost/_server", {
      method: "POST",
      headers: { "X-Server-Id": "fn", "X-Server-Instance": "server-fn:1" },
    });
    const h3Event = { res: { headers: new Headers(), status: 200 } };
    vi.mocked(getFetchEvent).mockReturnValue({
      request,
      response: { headers: { getSetCookie: () => [] } },
      nativeEvent: h3Event,
      locals: {},
    } as unknown as FetchEvent);
    vi.mocked(getServerFunction).mockReturnValue(() => {
      throw thrown;
    });
    const { handleServerFunction } = await import("./handler.ts");
    await handleServerFunction(h3Event as never);
    return h3Event;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    configuredErrorHandler.current = undefined;
  });

  it("passes the thrown value to the handler", async () => {
    const thrown = new Error("boom");
    configuredErrorHandler.current = vi.fn(() => undefined);

    await callThrowing(thrown);

    expect(configuredErrorHandler.current).toHaveBeenCalledWith(thrown);
  });

  it("serializes the replacement the handler returns", async () => {
    configuredErrorHandler.current = () => new Error("replaced");

    const h3Event = await callThrowing(new Error("boom"));

    expect(h3Event.res.headers.get("X-Error")).toBe("replaced");
  });

  it("awaits an asynchronous replacement", async () => {
    configuredErrorHandler.current = async () => new Error("replaced asynchronously");

    const h3Event = await callThrowing(new Error("boom"));

    expect(h3Event.res.headers.get("X-Error")).toBe("replaced asynchronously");
  });

  it("treats a Response the handler returns as control flow", async () => {
    configuredErrorHandler.current = () => new Response(null, { status: 403 });

    const h3Event = await callThrowing(new Error("boom"));

    expect(h3Event.res.status).toBe(403);
    expect(h3Event.res.headers.get("X-Error")).toBe("true");
  });

  it("keeps the original error when the handler returns nothing", async () => {
    configuredErrorHandler.current = () => undefined;

    const h3Event = await callThrowing(new Error("boom"));

    expect(h3Event.res.headers.get("X-Error")).toBe("boom");
  });

  it("keeps the original error when an asynchronous handler returns nothing", async () => {
    configuredErrorHandler.current = async () => undefined;

    const h3Event = await callThrowing(new Error("boom"));

    expect(h3Event.res.headers.get("X-Error")).toBe("boom");
  });

  it("leaves the response untouched when no handler is configured", async () => {
    const h3Event = await callThrowing(new Error("boom"));

    expect(h3Event.res.headers.get("X-Error")).toBe("boom");
  });
});
