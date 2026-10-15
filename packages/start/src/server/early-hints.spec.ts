import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEarlyHints, toLinkValues } from "./early-hints";
import type { Asset, FetchEvent } from "./types";

const assets: Asset[] = [
  { tag: "link", attrs: { href: "/_build/assets/client.css", rel: "stylesheet" } },
  { tag: "link", attrs: { href: "/_build/assets/client.js", rel: "modulepreload" } },
  { tag: "link", attrs: { href: "/_build/assets/漢字-abc.js", rel: "modulepreload" } },
  { tag: "style", attrs: {}, children: "body {}" },
  { tag: "link", attrs: { href: "/favicon.ico", rel: "icon" } }
];

function createEvent(res: Record<string, unknown>) {
  return { nativeEvent: { node: { res } } } as unknown as FetchEvent;
}

describe("toLinkValues", () => {
  it("preloads stylesheets and modulepreloads scripts, like the page does", () => {
    expect(toLinkValues(assets)).toEqual([
      "</_build/assets/client.css>; rel=preload; as=style",
      "</_build/assets/client.js>; rel=modulepreload",
      "</_build/assets/%E6%BC%A2%E5%AD%97-abc.js>; rel=modulepreload"
    ]);
  });
});

describe("sendEarlyHints", () => {
  beforeEach(() => {
    vi.stubEnv("PROD", true);
    // A build inlines a boolean here. Vitest stores env values as strings, so a
    // test can only set it (truthy) or leave it unset (falsy).
    import.meta.env.START_EARLY_HINTS = true;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (import.meta.env as Partial<ImportMetaEnv>).START_EARLY_HINTS;
  });

  it("writes a 103 response on Node", () => {
    const res = { socket: {}, headersSent: false, writeEarlyHints: vi.fn(), appendHeader: vi.fn() };
    sendEarlyHints(createEvent(res), assets);

    expect(res.writeEarlyHints).toHaveBeenCalledWith({ link: toLinkValues(assets) });
    expect(res.appendHeader).not.toHaveBeenCalled();
  });

  it("adds Link headers instead when the response has no socket", () => {
    const res = {
      socket: null,
      headersSent: false,
      writeEarlyHints: vi.fn(),
      appendHeader: vi.fn()
    };
    sendEarlyHints(createEvent(res), assets);

    expect(res.writeEarlyHints).not.toHaveBeenCalled();
    expect(res.appendHeader.mock.calls).toEqual(toLinkValues(assets).map(link => ["link", link]));
  });

  it("does nothing when the earlyHints option is off", () => {
    delete (import.meta.env as Partial<ImportMetaEnv>).START_EARLY_HINTS;
    const res = { socket: {}, headersSent: false, writeEarlyHints: vi.fn(), appendHeader: vi.fn() };
    sendEarlyHints(createEvent(res), assets);
    expect(res.writeEarlyHints).not.toHaveBeenCalled();
  });

  it("does nothing outside production", () => {
    vi.stubEnv("PROD", false);
    const res = { socket: {}, headersSent: false, writeEarlyHints: vi.fn(), appendHeader: vi.fn() };
    sendEarlyHints(createEvent(res), assets);
    expect(res.writeEarlyHints).not.toHaveBeenCalled();
  });

  it("does nothing once the response headers are sent", () => {
    const res = { socket: {}, headersSent: true, writeEarlyHints: vi.fn(), appendHeader: vi.fn() };
    sendEarlyHints(createEvent(res), assets);
    expect(res.writeEarlyHints).not.toHaveBeenCalled();
    expect(res.appendHeader).not.toHaveBeenCalled();
  });
});
