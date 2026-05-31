import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Fixture: a vite manifest that exposes one entry chunk, one dynamic-entry
// route chunk with a stylesheet, and one nested import-only chunk.
const fixtureManifest = {
  "src/entry-client.tsx": {
    file: "assets/entry-client-abc.js",
    isEntry: true,
    css: ["assets/entry-client-xyz.css"],
    imports: ["_shared.js"],
  },
  "_shared.js": {
    file: "assets/shared-def.js",
    css: [],
  },
  "src/routes/foo.tsx": {
    file: "assets/foo-ghi.js",
    isDynamicEntry: true,
    css: ["assets/foo-jkl.css"],
    imports: ["_shared.js"],
  },
};

vi.mock("solid-start:client-vite-manifest", () => ({
  clientViteManifest: fixtureManifest,
}));

async function loadModule() {
  // Top-level reads of import.meta.env need to be captured at import time,
  // so isolate the module cache to pick up the current stubs.
  vi.resetModules();
  return await import("./prod-ssr-manifest.ts");
}

describe("getSsrProdManifest under a deploy base", () => {
  beforeEach(() => {
    vi.stubEnv("BASE_URL", "/sub/");
    vi.stubEnv("START_CLIENT_ENTRY", "./src/entry-client.tsx");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("path(id) returns the asset URL prefixed with BASE_URL", async () => {
    const { getSsrProdManifest } = await loadModule();
    const m = getSsrProdManifest();

    expect(m.path("src/entry-client.tsx")).toBe("/sub/assets/entry-client-abc.js");
  });

  it("path(id) normalizes a leading './' the same as the unprefixed form", async () => {
    const { getSsrProdManifest } = await loadModule();
    const m = getSsrProdManifest();

    expect(m.path("./src/entry-client.tsx")).toBe("/sub/assets/entry-client-abc.js");
  });

  it("getAssets(id) returns asset hrefs prefixed with BASE_URL", async () => {
    const { getSsrProdManifest } = await loadModule();
    const m = getSsrProdManifest();
    const assets = await m.getAssets("src/routes/foo.tsx");
    const hrefs = assets.map(a => a.attrs.href as string).sort();

    // Every emitted href must sit under the deploy base; none may be
    // root-absolute at "/assets/...".
    for (const href of hrefs) {
      expect(href.startsWith("/sub/")).toBe(true);
    }
  });

  it("json() serializes each entry with a base-prefixed output path", async () => {
    const { getSsrProdManifest } = await loadModule();
    const m = getSsrProdManifest();
    const json = await m.json();

    expect(json["src/entry-client.tsx"].output).toBe("/sub/assets/entry-client-abc.js");
    expect(json["src/routes/foo.tsx"].output).toBe("/sub/assets/foo-ghi.js");
  });
});

describe("getSsrProdManifest with BASE_URL = '/' (no subpath)", () => {
  beforeEach(() => {
    vi.stubEnv("BASE_URL", "/");
    vi.stubEnv("START_CLIENT_ENTRY", "./src/entry-client.tsx");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("path(id) returns a root-absolute URL (no '//' prefix)", async () => {
    const { getSsrProdManifest } = await loadModule();
    const m = getSsrProdManifest();

    expect(m.path("src/entry-client.tsx")).toBe("/assets/entry-client-abc.js");
  });

  it("getAssets(id) returns single-slash hrefs", async () => {
    const { getSsrProdManifest } = await loadModule();
    const m = getSsrProdManifest();
    const assets = await m.getAssets("src/routes/foo.tsx");

    for (const a of assets) {
      const href = a.attrs.href as string;
      expect(href.startsWith("//")).toBe(false);
      expect(href.startsWith("/")).toBe(true);
    }
  });
});
