import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PageEvent } from "./types.ts";

const streamMock = vi.hoisted(() => ({
  stream: undefined as
    | ({
        then: PromiseLike<string>["then"];
        pipeTo: ReturnType<typeof vi.fn>;
      } & Record<string, unknown>)
    | undefined,
}));

vi.mock("solid-start:middleware", () => ({
  default: [],
}));

vi.mock("solid-js/web", () => ({
  getRequestEvent: vi.fn(() => ({
    request: new Request("http://localhost/"),
    response: new Response(null, {
      headers: {
        "content-type": "text/html",
      },
    }),
  })),
  renderToStream: vi.fn(() => streamMock.stream),
  renderToString: vi.fn(() => "<html></html>"),
}));

vi.mock("../fns/handler.ts", () => ({
  handleServerFunction: vi.fn(),
}));

vi.mock("../router.tsx", () => ({
  createRoutes: vi.fn(() => []),
}));

vi.mock("./fetchEvent.ts", () => ({
  decorateHandler: vi.fn(handler => handler),
  decorateMiddleware: vi.fn(middleware => middleware),
}));

vi.mock("./manifest/ssr-manifest.ts", () => ({
  getSsrManifest: vi.fn(),
}));

vi.mock("./routes.ts", () => ({
  matchAPIRoute: vi.fn(),
}));

describe("createBaseHandler", () => {
  beforeEach(() => {
    vi.stubEnv("START_SSR", "true");
    globalThis.USING_SOLID_START_DEV_SERVER = true;
    const html = Promise.resolve("<html>dev stream</html>");
    streamMock.stream = {
      then: html.then.bind(html),
      pipeTo: vi.fn(),
    };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete globalThis.USING_SOLID_START_DEV_SERVER;
    streamMock.stream = undefined;
  });

  it("returns the thenable Solid stream in the dev server branch", async () => {
    const { createBaseHandler } = await import("./handler.ts");
    const app = createBaseHandler(
      async event =>
        ({
          ...event,
          assets: [],
          router: {},
          routes: [],
          complete: false,
          $islands: new Set(),
        }) as PageEvent,
      () => null,
    );

    const response = await app.request(new Request("http://localhost/"));

    expect(await response.text()).toBe("<html>dev stream</html>");
    expect(streamMock.stream?.then).toEqual(expect.any(Function));
    expect(streamMock.stream?.pipeTo).not.toHaveBeenCalled();
  });
});
