import { H3Event } from "vinxi/http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cloneEvent, createFetchEvent, getFetchEvent, mergeResponseHeaders } from "./fetchEvent";

vi.mock("vinxi/http", () => ({
  getWebRequest: vi.fn(),
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

import * as vinxiHttp from "vinxi/http";
const mockedVinxiHttp = vi.mocked(vinxiHttp);

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

    mockedVinxiHttp.getWebRequest.mockReturnValue(mockH3Event.web?.request!);
    mockedVinxiHttp.getRequestIP.mockReturnValue("127.0.0.1");
    mockedVinxiHttp.getResponseStatus.mockReturnValue(200);
    mockedVinxiHttp.setResponseStatus.mockImplementation(() => {});
    mockedVinxiHttp.getResponseStatusText.mockReturnValue("OK");
    mockedVinxiHttp.getResponseHeader.mockReturnValue(undefined);
    mockedVinxiHttp.getResponseHeaders.mockReturnValue({});
    mockedVinxiHttp.setResponseHeader.mockImplementation(() => {});
    mockedVinxiHttp.appendResponseHeader.mockImplementation(() => {});
    mockedVinxiHttp.removeResponseHeader.mockImplementation(() => {});
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

  describe("cloneEvent", () => {
    it("should create a shallow copy of FetchEvent", () => {
      const original = createFetchEvent(mockH3Event);
      const cloned = cloneEvent(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.request).toBe(original.request);
      expect(cloned.response).toBe(original.response);
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

      expect(mockedVinxiHttp.appendResponseHeader).toHaveBeenCalledWith(
        mockH3Event,
        "content-type",
        "application/json"
      );
      expect(mockedVinxiHttp.appendResponseHeader).toHaveBeenCalledWith(
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
        expect(mockedVinxiHttp.setResponseStatus).toHaveBeenCalledWith(mockH3Event, 404);
      });
    });

    describe("statusText", () => {
      it("should get statusText from H3Event", () => {
        expect(fetchEvent.response.statusText).toBe("OK");
      });

      it("should set statusText on H3Event", () => {
        fetchEvent.response.statusText = "Not Found";
        expect(mockedVinxiHttp.setResponseStatus).toHaveBeenCalledWith(
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
        mockedVinxiHttp.getResponseHeader.mockReturnValue("application/json");
        expect(fetchEvent.response.headers.get("content-type")).toBe("application/json");
      });

      it("should join array values with comma", () => {
        mockedVinxiHttp.getResponseHeader.mockReturnValue(["text/html", "application/json"]);
        expect(fetchEvent.response.headers.get("accept")).toBe("text/html, application/json");
      });
    });

    describe("has", () => {
      it("should return false for non-existent header", () => {
        mockedVinxiHttp.getResponseHeader.mockReturnValue(undefined);
        expect(fetchEvent.response.headers.has("non-existent")).toBe(false);
      });

      it("should return true for existing header", () => {
        mockedVinxiHttp.getResponseHeader.mockReturnValue("application/json");
        expect(fetchEvent.response.headers.has("content-type")).toBe(true);
      });
    });

    describe("set", () => {
      it("should set header value", () => {
        fetchEvent.response.headers.set("content-type", "application/json");
        expect(mockedVinxiHttp.setResponseHeader).toHaveBeenCalledWith(
          mockH3Event,
          "content-type",
          "application/json"
        );
      });
    });

    describe("delete", () => {
      it("should remove header", () => {
        fetchEvent.response.headers.delete("content-type");
        expect(mockedVinxiHttp.removeResponseHeader).toHaveBeenCalledWith(
          mockH3Event,
          "content-type"
        );
      });
    });

    describe("append", () => {
      it("should append header value", () => {
        fetchEvent.response.headers.append("x-custom", "value");
        expect(mockedVinxiHttp.appendResponseHeader).toHaveBeenCalledWith(
          mockH3Event,
          "x-custom",
          "value"
        );
      });
    });

    describe("getSetCookie", () => {
      it("should return array for single cookie", () => {
        mockedVinxiHttp.getResponseHeader.mockReturnValue("session=abc123");
        expect(fetchEvent.response.headers.getSetCookie()).toEqual(["session=abc123"]);
      });

      it("should return array for multiple cookies", () => {
        mockedVinxiHttp.getResponseHeader.mockReturnValue(["session=abc123", "theme=dark"]);
        expect(fetchEvent.response.headers.getSetCookie()).toEqual([
          "session=abc123",
          "theme=dark"
        ]);
      });
    });

    describe("forEach", () => {
      it("should iterate over headers", () => {
        mockedVinxiHttp.getResponseHeaders.mockReturnValue({
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
        mockedVinxiHttp.getResponseHeaders.mockReturnValue({
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
        mockedVinxiHttp.getResponseHeaders.mockReturnValue({
          "content-type": "application/json",
          "x-custom": "value"
        });

        const keys = Array.from(fetchEvent.response.headers.keys());
        expect(keys).toEqual(["content-type", "x-custom"]);
      });
    });

    describe("values", () => {
      it("should return iterator of header values", () => {
        mockedVinxiHttp.getResponseHeaders.mockReturnValue({
          "content-type": "application/json",
          "x-custom": ["value1", "value2"]
        });

        const values = Array.from(fetchEvent.response.headers.values());
        expect(values).toEqual(["application/json", "value1, value2"]);
      });
    });

    describe("Symbol.iterator", () => {
      it("should be iterable", () => {
        mockedVinxiHttp.getResponseHeaders.mockReturnValue({
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
