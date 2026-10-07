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
