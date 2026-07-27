import { createComponent, ErrorBoundary, Suspense } from "solid-js";
import { renderToStream } from "solid-js/web";
import { describe, expect, it, vi } from "vitest";

// `lazy.ts` only touches these to attach a route's CSS/preload assets during
// SSR; neither is available (or relevant) outside a Vite build.
vi.mock("solid-start:get-manifest", () => ({
  getManifest: () => ({ getAssets: async () => [] }),
}));
vi.mock("../server/assets/index.ts", () => ({ useAssets: () => {} }));

const { default: lazy } = await import("./lazy.ts");

/** Render `code` to a stream and resolve once Solid closes it, or reject on timeout. */
function render(code: () => any, timeout = 1000) {
  return new Promise<string>((resolve, reject) => {
    let html = "";
    const timer = setTimeout(
      () => reject(new Error("the SSR stream never closed")),
      timeout,
    ).unref?.();

    renderToStream(code).pipe({
      write(payload: string) {
        html += payload;
      },
      end() {
        clearTimeout(timer as any);
        resolve(html);
      },
    });
  });
}

describe("lazy", () => {
  // A module with a syntax error rejects the dynamic import. Solid's server-side
  // `lazy` has no rejection path, so without our handling the Suspense boundary
  // stays pending, the stream never closes, and the browser is left on a blank
  // page with no error reported anywhere.
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
