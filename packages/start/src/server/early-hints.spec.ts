import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Asset } from "./assets/render.tsx";
import type { FetchEvent } from "./types.ts";

const writeEarlyHints = vi.fn();
vi.mock("h3", () => ({ writeEarlyHints }));

const { sendEarlyHints, toLinkValues } = await import("./early-hints.ts");

const assets: Asset[] = [
  { tag: "link", attrs: { href: "/_build/assets/entry-client.css", rel: "stylesheet" } },
  { tag: "link", attrs: { href: "/_build/assets/entry-client.js", rel: "modulepreload" } },
  { tag: "link", attrs: { href: "/_build/assets/漢字-abc.js", rel: "modulepreload" } },
  { tag: "style", attrs: {}, children: "body {}" },
  { tag: "link", attrs: { href: "/favicon.ico", rel: "icon" } },
];

function createEvent(headersSent = false) {
  return { nativeEvent: { runtime: { node: { res: { headersSent } } } } } as unknown as FetchEvent;
}

describe("toLinkValues", () => {
  it("preloads stylesheets and modulepreloads scripts, like the page does", () => {
    expect(toLinkValues(assets)).toEqual([
      "</_build/assets/entry-client.css>; rel=preload; as=style",
      "</_build/assets/entry-client.js>; rel=modulepreload",
      "</_build/assets/%E6%BC%A2%E5%AD%97-abc.js>; rel=modulepreload",
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
    writeEarlyHints.mockReset();
  });

  it("sends the assets as early hints", () => {
    const event = createEvent();
    sendEarlyHints(event, assets);

    expect(writeEarlyHints).toHaveBeenCalledWith(event.nativeEvent, {
      link: toLinkValues(assets),
    });
  });

  it("does nothing when the earlyHints option is off", () => {
    delete (import.meta.env as Partial<ImportMetaEnv>).START_EARLY_HINTS;
    sendEarlyHints(createEvent(), assets);
    expect(writeEarlyHints).not.toHaveBeenCalled();
  });

  it("does nothing outside production", () => {
    vi.stubEnv("PROD", false);
    sendEarlyHints(createEvent(), assets);
    expect(writeEarlyHints).not.toHaveBeenCalled();
  });

  it("does nothing once the response headers are sent", () => {
    sendEarlyHints(createEvent(true), assets);
    expect(writeEarlyHints).not.toHaveBeenCalled();
  });

  it("does nothing when there is nothing to hint", () => {
    sendEarlyHints(createEvent(), [{ tag: "style", attrs: {}, children: "body {}" }]);
    expect(writeEarlyHints).not.toHaveBeenCalled();
  });
});
