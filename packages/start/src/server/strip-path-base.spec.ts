import { describe, expect, it } from "vitest";

import { stripPathBase } from "./strip-path-base.ts";

describe("stripPathBase", () => {
  it("leaves paths unchanged for an empty or root base", () => {
    expect(stripPathBase("/api/hello", "")).toBe("/api/hello");
    expect(stripPathBase("/api/hello", "/")).toBe("/api/hello");
  });

  it("strips the base from paths below it", () => {
    expect(stripPathBase("/app/api/hello", "/app")).toBe("/api/hello");
    expect(stripPathBase("/app/api/hello", "/app/")).toBe("/api/hello");
  });

  it("maps an exact base path to root", () => {
    expect(stripPathBase("/app", "/app")).toBe("/");
  });

  it("does not strip a partial path segment match", () => {
    expect(stripPathBase("/application/api/hello", "/app")).toBe("/application/api/hello");
  });
});
