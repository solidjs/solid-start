import { describe, expect, it, vi } from "vitest";

const GET = { import: () => Promise.resolve({}) };

// What the server file router produces for `routes/[...404].tsx` exporting
// both a page and `GET`, with and without the page component.
vi.mock("solid-start:routes", () => ({
  default: [
    {
      path: "/*404",
      page: true,
      $component: { src: "routes/[...404].tsx", import: () => Promise.resolve({}) },
      $GET: GET,
    },
    { path: "/spa/*404", page: true, $GET: GET },
    { path: "/api/*rest", $GET: GET },
    { path: "/cors", $OPTIONS: GET },
  ],
}));

const { matchAPIRoute } = await import("./api-routes.ts");

describe("matchAPIRoute", () => {
  it("marks a route with a page and an API handler as a page", () => {
    expect(matchAPIRoute("/missing", "GET")?.isPage).toBe(true);
  });

  it("marks it as a page in SPA builds, where the server routes have no page components", () => {
    expect(matchAPIRoute("/spa/missing", "GET")?.isPage).toBe(true);
  });

  it("does not mark an API-only route as a page", () => {
    expect(matchAPIRoute("/api/missing", "GET")?.isPage).toBe(false);
  });

  it("matches a route that only exports OPTIONS", () => {
    expect(matchAPIRoute("/cors", "OPTIONS")?.handler).toBe(GET);
  });
});
