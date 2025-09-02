import { H3Event } from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFetchEvent, getFetchEvent, mergeResponseHeaders } from "./fetchEvent";

vi.mock('h3', () => ({
  toWebRequest: vi.fn(),
  getRequestIP: vi.fn(),
  getResponseStatus: vi.fn(),
  setResponseStatus: vi.fn(),
  getResponseStatusText: vi.fn(),
  getResponseHeader: vi.fn(),
  getResponseHeaders: vi.fn(),
  setResponseHeader: vi.fn(),
  appendResponseHeader: vi.fn(),
  removeResponseHeader: vi.fn()
}));

import * as h3 from "h3";
const mockedH3 = vi.mocked(h3)

const createMockH3Event = (): H3Event => {
  const mockRequest = new Request("http://localhost/test");
  const mockStatus = 200;
  const mockStatusText = "OK";

  return {
    node: {
      req: {},
      res: {
        statusCode: mockStatus,
        statusMessage: mockStatusText
      }
    },
    context: {},
    web: {
      request: mockRequest
    }
  } as H3Event;
};

describe("fetchEvent", () => {
  let mockH3Event: H3Event;

  beforeEach(() => {
    mockH3Event = createMockH3Event();
    vi.clearAllMocks();

    mockedH3.toWebRequest.mockReturnValue(mockH3Event.web?.request!);
    mockedH3.getRequestIP.mockReturnValue("127.0.0.1");
    mockedH3.getResponseStatus.mockReturnValue(200);
    mockedH3.setResponseStatus.mockImplementation(() => {});
    mockedH3.getResponseStatusText.mockReturnValue("OK");
    mockedH3.getResponseHeader.mockReturnValue(undefined);
    mockedH3.getResponseHeaders.mockReturnValue({});
    mockedH3.setResponseHeader.mockImplementation(() => {});
    mockedH3.appendResponseHeader.mockImplementation(() => {});
    mockedH3.removeResponseHeader.mockImplementation(() => {});
  });

  describe("createFetchEvent", () => {
    it("should create a FetchEvent from H3Event", () => {
      const fetchEvent = createFetchEvent(mockH3Event);

      expect(fetchEvent).toEqual({
        request: mockH3Event.web?.request,
        response: expect.any(Object),
        clientAddress: "127.0.0.1",
        locals: {},
        nativeEvent: mockH3Event
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
        "x-custom": "value"
      });

      mergeResponseHeaders(mockH3Event, headers);

      expect(mockedH3.appendResponseHeader).toHaveBeenCalledWith(
        mockH3Event,
        "content-type",
        "application/json"
      );
      expect(mockedH3.appendResponseHeader).toHaveBeenCalledWith(
        mockH3Event,
        "x-custom",
        "value"
      );
    });
  });

  describe("ResponseStub", () => {
    let fetchEvent: any;

    beforeEach(() => {
      fetchEvent = createFetchEvent(mockH3Event);
    });

    describe("status", () => {
      it("should get status from H3Event", () => {
        expect(fetchEvent.response.status).toBe(200);
      });

      it("should set status on H3Event", () => {
        fetchEvent.response.status = 404;
        expect(mockedH3.setResponseStatus).toHaveBeenCalledWith(mockH3Event, 404);
      });
    });

    describe("statusText", () => {
      it("should get statusText from H3Event", () => {
        expect(fetchEvent.response.statusText).toBe("OK");
      });

      it("should set statusText on H3Event", () => {
        fetchEvent.response.statusText = "Not Found";
        expect(mockedH3.setResponseStatus).toHaveBeenCalledWith(
          mockH3Event,
          200,
          "Not Found"
        );
      });
    });
  });

  describe("HeaderProxy", () => {
    let fetchEvent: any;

    beforeEach(() => {
      fetchEvent = createFetchEvent(mockH3Event);
    });

    describe("get", () => {
      it("should return null for non-existent header", () => {
        expect(fetchEvent.response.headers.get("non-existent")).toBe(null);
      });

      it("should return string value for single header", () => {
        mockedH3.getResponseHeader.mockReturnValue("application/json");
        expect(fetchEvent.response.headers.get("content-type")).toBe("application/json");
      });

      it("should join array values with comma", () => {
        mockedH3.getResponseHeader.mockReturnValue(["text/html", "application/json"]);
        expect(fetchEvent.response.headers.get("accept")).toBe("text/html, application/json");
      });
    });

    describe("has", () => {
      it("should return false for non-existent header", () => {
        mockedH3.getResponseHeader.mockReturnValue(undefined);
        expect(fetchEvent.response.headers.has("non-existent")).toBe(false);
      });

      it("should return true for existing header", () => {
        mockedH3.getResponseHeader.mockReturnValue("application/json");
        expect(fetchEvent.response.headers.has("content-type")).toBe(true);
      });
    });

    describe("set", () => {
      it("should set header value", () => {
        fetchEvent.response.headers.set("content-type", "application/json");
        expect(mockedH3.setResponseHeader).toHaveBeenCalledWith(
          mockH3Event,
          "content-type",
          "application/json"
        );
      });
    });

    describe("delete", () => {
      it("should remove header", () => {
        fetchEvent.response.headers.delete("content-type");
        expect(mockedH3.removeResponseHeader).toHaveBeenCalledWith(
          mockH3Event,
          "content-type"
        );
      });
    });

    describe("append", () => {
      it("should append header value", () => {
        fetchEvent.response.headers.append("x-custom", "value");
        expect(mockedH3.appendResponseHeader).toHaveBeenCalledWith(
          mockH3Event,
          "x-custom",
          "value"
        );
      });
    });

    describe("getSetCookie", () => {
      it("should return array for single cookie", () => {
        mockedH3.getResponseHeader.mockReturnValue("session=abc123");
        expect(fetchEvent.response.headers.getSetCookie()).toEqual(["session=abc123"]);
      });

      it("should return array for multiple cookies", () => {
        mockedH3.getResponseHeader.mockReturnValue(["session=abc123", "theme=dark"]);
        expect(fetchEvent.response.headers.getSetCookie()).toEqual([
          "session=abc123",
          "theme=dark"
        ]);
      });
    });

    describe("forEach", () => {
      it("should iterate over headers", () => {
        mockedH3.getResponseHeaders.mockReturnValue({
          "content-type": "application/json",
          "x-custom": ["value1", "value2"]
        });

        const callback = vi.fn();
        fetchEvent.response.headers.forEach(callback);

        expect(callback).toHaveBeenCalledWith(
          "application/json",
          "content-type",
          expect.any(Object)
        );
        expect(callback).toHaveBeenCalledWith("value1, value2", "x-custom", expect.any(Object));
      });
    });

    describe("entries", () => {
      it("should return iterator of header entries", () => {
        mockedH3.getResponseHeaders.mockReturnValue({
          "content-type": "application/json",
          "x-custom": ["value1", "value2"]
        });

        const entries = Array.from(fetchEvent.response.headers.entries());
        expect(entries).toEqual([
          ["content-type", "application/json"],
          ["x-custom", "value1, value2"]
        ]);
      });
    });

    describe("keys", () => {
      it("should return iterator of header keys", () => {
        mockedH3.getResponseHeaders.mockReturnValue({
          "content-type": "application/json",
          "x-custom": "value"
        });

        const keys = Array.from(fetchEvent.response.headers.keys());
        expect(keys).toEqual(["content-type", "x-custom"]);
      });
    });

    describe("values", () => {
      it("should return iterator of header values", () => {
        mockedH3.getResponseHeaders.mockReturnValue({
          "content-type": "application/json",
          "x-custom": ["value1", "value2"]
        });

        const values = Array.from(fetchEvent.response.headers.values());
        expect(values).toEqual(["application/json", "value1, value2"]);
      });
    });

    describe("Symbol.iterator", () => {
      it("should be iterable", () => {
        mockedH3.getResponseHeaders.mockReturnValue({
          "content-type": "application/json",
          "x-custom": "value"
        });

        const entries = Array.from(fetchEvent.response.headers);
        expect(entries).toEqual([
          ["content-type", "application/json"],
          ["x-custom", "value"]
        ]);
      });
    });
  });
});
