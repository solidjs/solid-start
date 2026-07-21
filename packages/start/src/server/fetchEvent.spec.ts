import * as h3 from "h3";
import { getRequestEvent } from "@solidjs/web";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFetchEvent,
  decorateHandler,
  decorateMiddleware,
  getFetchEvent,
  mergeResponseHeaders,
} from "./fetchEvent.ts";

vi.mock(import("h3"), async mod => {
  return {
    ...(await mod()),
    getRequestIP: vi.fn(),
  };
});

const mockedH3 = vi.mocked(h3);

const createMockH3Event = (): h3.H3Event => {
  const event = new h3.H3Event(new Request("http://localhost/test"));

  event.res.status = 200;
  event.res.statusText = "OK";

  return event;
};

describe("fetchEvent", () => {
  let mockH3Event: h3.H3Event;

  beforeEach(() => {
    mockH3Event = createMockH3Event();
    vi.clearAllMocks();

    mockedH3.getRequestIP.mockReturnValue("127.0.0.1");
  });

  describe("createFetchEvent", () => {
    it("should create a FetchEvent from H3Event", () => {
      const fetchEvent = createFetchEvent(mockH3Event);

      expect(fetchEvent).toEqual({
        request: mockH3Event.req,
        response: expect.any(Object),
        clientAddress: "127.0.0.1",
        locals: {},
        nativeEvent: mockH3Event,
      });
    });

    it("should create response stub with correct properties", () => {
      const fetchEvent = createFetchEvent(mockH3Event);

      expect(fetchEvent.response).toHaveProperty("status");
      expect(fetchEvent.response).toHaveProperty("statusText");
      expect(fetchEvent.response).toHaveProperty("headers");
    });
  });

  describe("getFetchEvent", () => {
    it("should create and cache FetchEvent on first call", () => {
      const fetchEvent = getFetchEvent(mockH3Event);

      expect(mockH3Event.context.solidFetchEvent).toBe(fetchEvent);
      expect(fetchEvent.nativeEvent).toBe(mockH3Event);
    });

    it("should return cached FetchEvent on subsequent calls", () => {
      const firstCall = getFetchEvent(mockH3Event);
      const secondCall = getFetchEvent(mockH3Event);

      expect(firstCall).toBe(secondCall);
    });
  });

  describe("mergeResponseHeaders", () => {
    it("should merge headers from Headers object to H3Event", () => {
      const headers = new Headers({
        "content-type": "application/json",
        "x-custom": "value",
      });

      mergeResponseHeaders(mockH3Event, headers);

      expect(headers.get("content-type")).toBe("application/json");
      expect(headers.get("x-custom")).toBe("value");
    });
  });

  describe("decorateHandler", () => {
    it("provides the FetchEvent while the handler runs", async () => {
      const handler = decorateHandler(async event => {
        await Promise.resolve();
        expect(getRequestEvent()).toBe(getFetchEvent(event));
        return "handled";
      });

      expect(await handler(mockH3Event)).toBe("handled");
    });
  });

  describe("decorateMiddleware", () => {
    it("provides the FetchEvent while the middleware runs", async () => {
      const next = vi.fn(async () => {
        await Promise.resolve();
        expect(getRequestEvent()).toBe(getFetchEvent(mockH3Event));
        return "next";
      });
      const middleware = decorateMiddleware(async (event, middlewareNext) => {
        expect(getRequestEvent()).toBe(getFetchEvent(event));
        const result = await middlewareNext();
        expect(getRequestEvent()).toBe(getFetchEvent(event));
        return result;
      });

      expect(await middleware(mockH3Event, next)).toBe("next");
      expect(next).toHaveBeenCalledOnce();
    });
  });
});
