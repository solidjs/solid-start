import { getRequestEvent } from "solid-js/web";
import { createApp, toWebHandler } from "vinxi/http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FetchEvent } from "../server/types";

const serverFn = vi.hoisted(() => ({
  calls: 0,
  current: (..._args: any[]): any => undefined
}));

vi.mock("solidstart:server-fn-manifest", () => ({
  default: {
    fn: {
      functionName: "fn",
      importer: async () => ({
        fn: (...args: any[]) => {
          serverFn.calls++;
          return serverFn.current(...args);
        }
      })
    }
  }
}));
vi.mock("../server/handler", () => ({ getExpectedRedirectStatus: () => 302 }));
vi.mock("../server/pageEvent", () => ({ createPageEvent: async () => {} }));

const { default: serverHandler } = await import("./server-handler");
const handle = toWebHandler(createApp().use(serverHandler));

const SERVER_URL = "http://localhost:3000/_server";

function call(
  init: { method?: string; headers?: Record<string, string>; body?: BodyInit; search?: string } = {}
) {
  const { method = "POST", headers = {}, body, search = "" } = init;
  return handle(
    new Request(SERVER_URL + search, {
      method,
      headers: { "x-server-id": "fn#fn", "x-server-instance": "server-fn:0", ...headers },
      body
    })
  );
}

const responseHeaders = () => (getRequestEvent() as FetchEvent).response.headers;

beforeEach(() => {
  serverFn.calls = 0;
  serverFn.current = () => "result";
});

describe("cross-site requests", () => {
  it("rejects a cross-site POST with 403 before the function runs", async () => {
    const response = await call({ headers: { "sec-fetch-site": "cross-site" } });
    expect(response.status).toBe(403);
    expect(serverFn.calls).toBe(0);
  });

  it("rejects a cross-site GET with 403 before the function runs", async () => {
    const response = await call({
      method: "GET",
      headers: { origin: "https://other.example" }
    });
    expect(response.status).toBe(403);
    expect(serverFn.calls).toBe(0);
  });

  it("rejects Origin: null without Sec-Fetch-Site", async () => {
    const response = await call({ headers: { origin: "null" } });
    expect(response.status).toBe(403);
    expect(serverFn.calls).toBe(0);
  });

  it("rejects before decoding the arguments", async () => {
    const response = await call({
      headers: { "sec-fetch-site": "cross-site", "x-serialized": "true" },
      body: "not json"
    });
    expect(response.status).toBe(403);
  });

  it("omits the message outside development", async () => {
    const response = await call({ headers: { "sec-fetch-site": "cross-site" } });
    expect(await response.text()).toBe("");
  });

  it.each<Record<string, string>>([
    { "sec-fetch-site": "same-origin" },
    { "sec-fetch-site": "same-site" },
    { "sec-fetch-site": "none" },
    { origin: "http://localhost:3000" },
    {}
  ])("allows %o", async headers => {
    const response = await call({ headers });
    expect(response.status).toBe(200);
    expect(serverFn.calls).toBe(1);
  });
});

describe("Cache-Control", () => {
  it("defaults a result to no-store", async () => {
    const response = await call();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("defaults a GET result to no-store", async () => {
    const response = await call({ method: "GET" });
    expect(serverFn.calls).toBe(1);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("defaults a thrown error to no-store", async () => {
    serverFn.current = () => {
      throw new Error("failed");
    };
    const response = await call();
    expect(response.headers.get("x-error")).toBe("failed");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("defaults a 403 refusal to no-store", async () => {
    const response = await call({ headers: { "sec-fetch-site": "cross-site" } });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("defaults a 404 for an unknown function to no-store", async () => {
    const response = await call({ headers: { "x-server-id": "missing#fn" } });
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("defaults an error that escapes the handler to no-store", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await call({ headers: { "x-serialized": "true" }, body: "not json" });
      expect(response.status).toBe(500);
      expect(response.headers.get("cache-control")).toBe("no-store");
    } finally {
      logged.mockRestore();
    }
  });

  it("defaults a no-JS redirect to no-store", async () => {
    const form = new FormData();
    form.append("field", "value");
    serverFn.current = () => undefined;
    const response = await call({
      headers: { "x-server-instance": "", referer: "http://localhost:3000/page" },
      search: "?id=fn&name=fn",
      body: form
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("keeps a value set on the event's response headers", async () => {
    serverFn.current = () => {
      responseHeaders().set("Cache-Control", "max-age=60");
      return "result";
    };
    const response = await call();
    expect(response.headers.get("cache-control")).toBe("max-age=60");
  });

  it("keeps a value appended to the event's response headers without joining the default", async () => {
    serverFn.current = () => {
      responseHeaders().append("Cache-Control", "max-age=60");
      return "result";
    };
    const response = await call();
    expect(response.headers.get("cache-control")).toBe("max-age=60");
  });

  it("keeps a value on a returned Response without joining the default", async () => {
    serverFn.current = () =>
      new Response(null, { headers: { "Cache-Control": "private, max-age=60" } });
    const response = await call();
    expect(response.headers.get("cache-control")).toBe("private, max-age=60");
  });

  it("keeps a value on a thrown Response", async () => {
    serverFn.current = () => {
      throw new Response(null, { status: 400, headers: { "Cache-Control": "max-age=5" } });
    };
    const response = await call();
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("max-age=5");
  });

  it("defaults a returned Response without its own value to no-store", async () => {
    serverFn.current = () => new Response(null, { headers: { "x-other": "1" } });
    const response = await call();
    expect(response.headers.get("x-other")).toBe("1");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("keeps a value on a raw Response passthrough", async () => {
    serverFn.current = () =>
      new Response("raw", { headers: { "X-Content-Raw": "true", "Cache-Control": "max-age=60" } });
    const response = await call();
    expect(await response.text()).toBe("raw");
    expect(response.headers.get("cache-control")).toBe("max-age=60");
  });

  it("defaults a raw Response passthrough without its own value to no-store", async () => {
    serverFn.current = () => new Response("raw", { headers: { "X-Content-Raw": "true" } });
    const response = await call();
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("does not set a value on a 304 Response", async () => {
    serverFn.current = () =>
      new Response(null, { status: 304, headers: { "X-Content-Raw": "true" } });
    const response = await call();
    expect(response.status).toBe(304);
    expect(response.headers.has("cache-control")).toBe(false);
  });

  it("does not set a value when the function answers 304 on the event", async () => {
    serverFn.current = () => {
      (getRequestEvent() as FetchEvent).response.status = 304;
      return null;
    };
    const response = await call();
    expect(response.status).toBe(304);
    expect(response.headers.has("cache-control")).toBe(false);
  });
});
