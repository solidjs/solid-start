import { describe, expect, it } from "vitest";
import { getFunctionIdFromPath, isServerFunctionPath, serverFunctionURL } from "./url.ts";

describe("serverFunctionURL", () => {
  it("puts the function id in the path", () => {
    expect(serverFunctionURL("a1b2c3-0-getUser")).toBe("/_server/a1b2c3-0-getUser");
  });

  it("encodes ids", () => {
    expect(serverFunctionURL("a1b2c3-0-a b")).toBe("/_server/a1b2c3-0-a%20b");
  });
});

describe("isServerFunctionPath", () => {
  it("matches the bare base and ids below it", () => {
    expect(isServerFunctionPath("/_server")).toBe(true);
    expect(isServerFunctionPath("/_server/a1b2c3-0-getUser")).toBe(true);
  });

  it("does not match routes that merely share the prefix", () => {
    expect(isServerFunctionPath("/_serverless")).toBe(false);
    expect(isServerFunctionPath("/about")).toBe(false);
  });
});

describe("getFunctionIdFromPath", () => {
  it("reads the id from the path", () => {
    expect(getFunctionIdFromPath("/_server/a1b2c3-0-getUser")).toBe("a1b2c3-0-getUser");
  });

  it("decodes the id", () => {
    expect(getFunctionIdFromPath("/_server/a1b2c3-0-a%20b")).toBe("a1b2c3-0-a b");
  });

  it("ignores a deployment base in front of the segment", () => {
    expect(getFunctionIdFromPath("/app/_server/a1b2c3-0-getUser")).toBe("a1b2c3-0-getUser");
  });

  it("returns null when there is no id", () => {
    expect(getFunctionIdFromPath("/_server")).toBe(null);
    expect(getFunctionIdFromPath("/_server/")).toBe(null);
    expect(getFunctionIdFromPath("/about")).toBe(null);
  });

  it("returns null for malformed encoding rather than throwing", () => {
    expect(getFunctionIdFromPath("/_server/%E0%A4%A")).toBe(null);
  });
});
