import { describe, expect, it } from "vitest";
import { isCrossSiteRequest } from "./cross-site";

const URL_STRING = "http://localhost:3000/_server";

function check(headers: Record<string, string>) {
  const request = new Request(URL_STRING, { method: "POST", headers });
  return isCrossSiteRequest(request, new URL(request.url));
}

describe("isCrossSiteRequest", () => {
  describe("with Sec-Fetch-Site", () => {
    it("rejects cross-site", () => {
      expect(check({ "sec-fetch-site": "cross-site" })).toBe(true);
    });

    it("allows same-origin", () => {
      expect(check({ "sec-fetch-site": "same-origin" })).toBe(false);
    });

    it("allows same-site", () => {
      expect(check({ "sec-fetch-site": "same-site" })).toBe(false);
    });

    it("allows none (a user-initiated navigation)", () => {
      expect(check({ "sec-fetch-site": "none" })).toBe(false);
    });

    it("takes precedence over a mismatched Origin", () => {
      expect(check({ "sec-fetch-site": "same-origin", origin: "https://other.example" })).toBe(false);
    });

    it("takes precedence over a matching Origin", () => {
      expect(check({ "sec-fetch-site": "cross-site", origin: "http://localhost:3000" })).toBe(true);
    });

    it("takes precedence over Origin: null", () => {
      expect(check({ "sec-fetch-site": "same-origin", origin: "null" })).toBe(false);
    });
  });

  describe("without Sec-Fetch-Site", () => {
    it("allows an Origin matching the request host", () => {
      expect(check({ origin: "http://localhost:3000" })).toBe(false);
    });

    it("rejects an Origin on another host", () => {
      expect(check({ origin: "https://other.example" })).toBe(true);
    });

    it("rejects an Origin on the same hostname but another port", () => {
      expect(check({ origin: "http://localhost:4000" })).toBe(true);
    });

    it("rejects an opaque Origin (null)", () => {
      expect(check({ origin: "null" })).toBe(true);
    });

    it("rejects an Origin that cannot be parsed", () => {
      expect(check({ origin: "not a url" })).toBe(true);
    });

    it("allows a request with neither header", () => {
      expect(check({})).toBe(false);
    });
  });
});
