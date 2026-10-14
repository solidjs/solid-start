import { describe, expect, it } from "vitest";

import { createStyleFilter } from "./manifest.ts";

describe("createStyleFilter", () => {
  it("excludes node_modules by default", () => {
    const filter = createStyleFilter();

    expect(filter("/app/src/app.tsx")).toBe(true);
    expect(filter("/app/node_modules/dependency/index.js")).toBe(false);
    expect(
      filter("/app/node_modules/.pnpm/dependency@1.0.0/node_modules/dependency/index.js"),
    ).toBe(false);
  });

  it("can include a dependency from npm and pnpm layouts", () => {
    const filter = createStyleFilter({
      exclude: /node_modules\/(?!(?:\.pnpm\/[^/]+\/node_modules\/)?my-dependency(?:\/|$))/,
    });

    const included = [
      "/app/node_modules/my-dependency/index.js",
      "/app/node_modules/.pnpm/my-dependency@1.0.0/node_modules/my-dependency/index.js",
      "/workspace/node_modules/.pnpm/my-dependency@1.0.0/node_modules/my-dependency/index.js",
    ];
    const excluded = [
      "/app/node_modules/other-dependency/index.js",
      "/app/node_modules/.pnpm/other-dependency@1.0.0/node_modules/other-dependency/index.js",
      "/workspace/node_modules/.pnpm/other-dependency@1.0.0/node_modules/other-dependency/index.js",
    ];

    for (const id of included) expect(filter(id)).toBe(true);
    for (const id of excluded) expect(filter(id)).toBe(false);
  });
});
