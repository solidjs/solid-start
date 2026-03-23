import { describe, expect, it } from "vitest";

import { stripPathBase } from "./strip-path-base.ts";

describe("stripPathBase", () => {
  it("leaves path unchanged when base is root or empty", () => {
    expect(stripPathBase("/api/hello", "/")).toBe("/api/hello");
    expect(stripPathBase("/api/hello", "")).toBe("/api/hello");
  });

  it("strips base without trailing slash", () => {
    expect(stripPathBase("/myapp/api/hello", "/myapp")).toBe("/api/hello");
  });

  it("strips base with trailing slash", () => {
    expect(stripPathBase("/myapp/api/hello", "/myapp/")).toBe("/api/hello");
  });

  it("maps exact base match to /", () => {
    expect(stripPathBase("/myapp", "/myapp")).toBe("/");
  });

  it("does not strip when path is not under base", () => {
    expect(stripPathBase("/other/api", "/myapp")).toBe("/other/api");
  });
});
