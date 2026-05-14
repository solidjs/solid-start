import { describe, expect, it, vi, beforeEach } from "vitest";
import type { FetchEvent } from "./types.ts";

vi.mock("h3", () => ({
  parseCookies: vi.fn(() => ({})),
  parseSetCookie: vi.fn(),
}));

vi.mock("solid-js/web", () => ({
  renderToString: vi.fn(),
  provideRequestEvent: vi.fn((_event, fn) => fn()),
}));

vi.mock("solid-start:server-fn-manifest", () => ({
  getServerFnById: vi.fn(),
}));

vi.mock("./handler.ts", () => ({
  createPageEvent: vi.fn(),
}));

vi.mock("./fetchEvent.ts", () => ({
  getFetchEvent: vi.fn(),
  mergeResponseHeaders: vi.fn(),
}));

function createMockFetchEvent(headers: Record<string, string> = {}): FetchEvent {
  return {
    request: new Request("http://localhost/test", { headers }),
    response: {
      headers: {
        getSetCookie: () => [],
      },
    },
    nativeEvent: {},
    locals: {},
  } as FetchEvent;
}

describe("createSingleFlightHeaders", () => {
  let createSingleFlightHeaders: (sourceEvent: FetchEvent) => Headers;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import("./server-functions-handler.ts");
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
      "cookie": "session=abc123",
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
});
