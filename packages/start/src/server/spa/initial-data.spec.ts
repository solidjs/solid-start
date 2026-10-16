import { sharedConfig } from "solid-js";
import { getRequestEvent } from "solid-js/web";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PageEvent } from "../types.ts";
import { InitialData, loadInitialData } from "./initial-data.ts";

vi.mock("solid-js/web", async () => {
  const { sharedConfig } = await import("solid-js");
  return {
    renderToString: (fn: () => unknown) => {
      sharedConfig.context = {} as any;
      try {
        return fn();
      } finally {
        sharedConfig.context = undefined;
      }
    },
    getRequestEvent: vi.fn(),
  };
});

vi.mock("../../router.tsx", () => ({
  createRoutes: () => [],
}));

// Stands in for the router: in data-only mode it records each query call in
// `event.router.data`, the way `query` does.
let queries: Record<string, () => unknown> = {};
let currentEvent: PageEvent;
vi.mock("solid-start:app", () => ({
  default: () => {
    const router = (currentEvent as any).router;
    if (!router.dataOnly) return;
    router.data ||= {};
    for (const key in queries) router.data[key] = queries[key]!();
  },
}));

function createEvent(): PageEvent {
  return {
    request: new Request("http://localhost/page"),
    response: { headers: new Headers() },
  } as unknown as PageEvent;
}

function serializeInitialData(event: PageEvent, async = true) {
  const serialize = vi.fn();
  vi.mocked(getRequestEvent).mockReturnValue(event);
  sharedConfig.context = { async, serialize } as any;
  try {
    InitialData();
  } finally {
    sharedConfig.context = undefined;
  }
  return Object.fromEntries(
    serialize.mock.calls.map(([key, value]) => [key, value as Promise<unknown>]),
  );
}

describe("ssr: data-only initial data", () => {
  beforeEach(() => {
    queries = {};
    currentEvent = createEvent();
  });

  it("streams the result of each query the page's preloads made", async () => {
    queries = {
      'user["1"]': () => Promise.resolve({ id: 1 }),
      "list[]": () => Promise.resolve([1, 2]),
    };
    await loadInitialData(currentEvent);

    const data = serializeInitialData(currentEvent);
    expect(Object.keys(data)).toEqual(['user["1"]', "list[]"]);
    await expect(data['user["1"]']).resolves.toEqual({ id: 1 });
    await expect(data["list[]"]).resolves.toEqual([1, 2]);
  });

  it("leaves the router out of data-only mode afterwards", async () => {
    queries = { "a[]": () => Promise.resolve(1) };
    await loadInitialData(currentEvent);
    expect((currentEvent as any).router.dataOnly).toBeUndefined();
    expect((currentEvent as any).router.data).toBeUndefined();
  });

  it("skips queries the router left out", async () => {
    queries = { "a[]": () => undefined, "b[]": () => Promise.resolve(2) };
    await loadInitialData(currentEvent);
    expect(Object.keys(serializeInitialData(currentEvent))).toEqual(["b[]"]);
  });

  it("sends the body of a json() response and keeps its headers except the body ones", async () => {
    queries = {
      "a[]": () => {
        const response = new Response(null, {
          headers: {
            "content-type": "application/json",
            "set-cookie": "a=1",
            "x-custom": "yes",
          },
        });
        (response as any).customBody = () => ({ ok: true });
        return Promise.resolve(response);
      },
    };
    currentEvent.response.headers.set("content-type", "text/html");
    currentEvent.response.headers.append("set-cookie", "b=2");
    await loadInitialData(currentEvent);

    await expect(serializeInitialData(currentEvent)["a[]"]).resolves.toEqual({ ok: true });
    expect(currentEvent.response.headers.get("content-type")).toBe("text/html");
    expect(currentEvent.response.headers.getSetCookie()).toEqual(["b=2", "a=1"]);
    expect(currentEvent.response.headers.get("x-custom")).toBe("yes");
  });

  it("turns a returned redirect into a redirect of the page", async () => {
    queries = {
      "a[]": () =>
        Promise.resolve(new Response(null, { status: 307, headers: { Location: "/login" } })),
    };
    await loadInitialData(currentEvent);

    await expect(serializeInitialData(currentEvent)["a[]"]).resolves.toBeUndefined();
    expect(currentEvent.response.headers.get("Location")).toBe("/login");
    expect(currentEvent.response.status).toBe(307);
  });

  it("does not report a thrown redirect as an error", async () => {
    queries = {
      "a[]": () => Promise.reject(new Response(null, { status: 302, headers: { Location: "/" } })),
    };
    await loadInitialData(currentEvent);

    await expect(serializeInitialData(currentEvent)["a[]"]).resolves.toBeUndefined();
    expect(currentEvent.response.headers.get("Location")).toBe("/");
  });

  it("streams a failed query as a rejection", async () => {
    const error = new Error("boom");
    queries = { "a[]": () => Promise.reject(error) };
    await loadInitialData(currentEvent);

    await expect(serializeInitialData(currentEvent)["a[]"]).rejects.toBe(error);
  });

  it("sends nothing from a render that can't stream", async () => {
    queries = { "a[]": () => Promise.resolve(1) };
    await loadInitialData(currentEvent);
    expect(serializeInitialData(currentEvent, false)).toEqual({});
  });

  it("sends nothing when the root can't render on the server", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    queries = {
      "a[]": () => {
        throw new Error("window is not defined");
      },
    };
    await loadInitialData(currentEvent);

    expect(consoleError).toHaveBeenCalled();
    expect(serializeInitialData(currentEvent)).toEqual({});
  });
});
