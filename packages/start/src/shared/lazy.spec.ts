import { createComponent, ErrorBoundary, Suspense } from "solid-js";
import { renderToStream } from "solid-js/web";
import { describe, expect, it, vi } from "vitest";

// Only used to attach a route's assets during SSR; neither exists outside a Vite build.
vi.mock("solid-start:get-manifest", () => ({
  getManifest: () => ({ getAssets: async () => [] }),
}));
vi.mock("../server/assets/index.ts", () => ({ useAssets: () => {} }));

const { default: lazy } = await import("./lazy.ts");

function render(code: () => any, timeout = 1000) {
  return new Promise<string>((resolve, reject) => {
    let html = "";
    const timer = setTimeout(() => reject(new Error("the SSR stream never closed")), timeout);

    renderToStream(code).pipe({
      write: (payload: string) => void (html += payload),
      end: () => {
        clearTimeout(timer);
        resolve(html);
      },
    });
  });
}

describe("lazy", () => {
  it("surfaces a failed module import instead of hanging the stream", async () => {
    const error = new Error("Unexpected token");
    const Broken = lazy(() => Promise.reject(error));

    let caught: unknown;
    const html = await render(() =>
      createComponent(ErrorBoundary, {
        fallback: (err: unknown) => {
          caught = err;
          return "boundary";
        },
        get children() {
          return createComponent(Suspense, {
            fallback: "loading",
            get children() {
              return createComponent(Broken, {});
            },
          });
        },
      }),
    );

    expect(caught).toBe(error);
    expect(html).toContain("boundary");
  });

  it("still renders a module that loads", async () => {
    const Ok = lazy(async () => ({ default: () => "loaded" }));

    const html = await render(() =>
      createComponent(Suspense, {
        fallback: "loading",
        get children() {
          return createComponent(Ok, {});
        },
      }),
    );

    expect(html).toContain("loaded");
  });
});
