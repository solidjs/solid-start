import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("solid-start:client-vite-manifest", () => ({
  clientViteManifest: {
    "src/entry-client.tsx": {
      file: "_build/assets/entry-client.js",
      css: ["_build/assets/entry-client.css"],
      imports: ["_shared.js"],
      isEntry: true,
    },
    "_shared.js": {
      file: "_build/assets/shared.js",
    },
  },
}));

vi.stubEnv("START_CLIENT_ENTRY", "./src/entry-client.tsx");

const { getSsrProdManifest } = await import("./prod-ssr-manifest.ts");

describe("getSsrProdManifest", () => {
  beforeEach(() => {
    vi.stubEnv("BASE_URL", "/foo/");
  });

  it("prefixes entry paths with the Vite base", () => {
    expect(getSsrProdManifest().path("./src/entry-client.tsx")).toBe(
      "/foo/_build/assets/entry-client.js",
    );
  });

  it("prefixes stylesheet and modulepreload URLs with the Vite base", async () => {
    const assets = await getSsrProdManifest().getAssets("./src/entry-client.tsx");

    expect(assets).toEqual([
      {
        tag: "link",
        attrs: {
          href: "/foo/_build/assets/entry-client.css",
          key: "_build/assets/entry-client.css",
          rel: "stylesheet",
        },
      },
      {
        tag: "link",
        attrs: {
          href: "/foo/_build/assets/shared.js",
          key: "_build/assets/shared.js",
          rel: "modulepreload",
        },
      },
      {
        tag: "link",
        attrs: {
          href: "/foo/_build/assets/entry-client.js",
          key: "_build/assets/entry-client.js",
          rel: "modulepreload",
        },
      },
    ]);
  });

  it("prefixes serialized manifest paths with the Vite base", async () => {
    await expect(getSsrProdManifest().json()).resolves.toMatchObject({
      "src/entry-client.tsx": {
        output: "/foo/_build/assets/entry-client.js",
      },
    });
  });

  it("preserves root-based URLs when the Vite base is root", async () => {
    vi.stubEnv("BASE_URL", "/");
    const manifest = getSsrProdManifest();

    expect(manifest.path("./src/entry-client.tsx")).toBe("/_build/assets/entry-client.js");
    await expect(manifest.getAssets("./src/entry-client.tsx")).resolves.toMatchObject([
      { attrs: { href: "/_build/assets/entry-client.css" } },
      { attrs: { href: "/_build/assets/shared.js" } },
      { attrs: { href: "/_build/assets/entry-client.js" } },
    ]);
  });
});
