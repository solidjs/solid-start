import { describe, it, expect } from "vitest";
import { createRoot } from "solid-js";
import { renderToString } from "solid-js/web";
import { createLazyRender } from "../create-lazy-render";
import { createClientSignal, ClientOnly } from "../client-only";
import { StartImage } from "../Image";

// ---------------------------------------------------------------------------
// createLazyRender
// ---------------------------------------------------------------------------
describe("createLazyRender", () => {
  it("starts with visible = false", () => {
    let visible: boolean | undefined;

    createRoot(dispose => {
      const laze = createLazyRender<HTMLDivElement>();
      visible = laze.visible;
      dispose();
    });

    expect(visible).toBe(false);
  });

  it("exposes a callable ref setter", () => {
    createRoot(dispose => {
      const laze = createLazyRender<HTMLDivElement>();
      expect(typeof laze.ref).toBe("function");
      dispose();
    });
  });

  it("returns correct shape with refresh option", () => {
    createRoot(dispose => {
      const laze = createLazyRender<HTMLDivElement>({ refresh: true });
      expect(typeof laze.ref).toBe("function");
      expect(laze.visible).toBe(false);
      dispose();
    });
  });
});

// ---------------------------------------------------------------------------
// createClientSignal  (server context -- isServer is true in Node)
// ---------------------------------------------------------------------------
describe("createClientSignal", () => {
  it("returns a function that resolves to false on the server", () => {
    const signal = createClientSignal();
    expect(typeof signal).toBe("function");
    expect(signal()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ClientOnly  (server context)
// ---------------------------------------------------------------------------
describe("ClientOnly", () => {
  it("renders the fallback in a server environment", () => {
    const html = renderToString(() => (
      <ClientOnly fallback={<span data-test="fallback">loading</span>}>
        <span data-test="child">client content</span>
      </ClientOnly>
    ));

    expect(html).toContain("loading");
    expect(html).not.toContain("client content");
  });

  it("renders the fallback element when no children are given", () => {
    const html = renderToString(() => (
      <ClientOnly fallback={<div>placeholder</div>} />
    ));

    expect(html).toContain("placeholder");
  });
});

// ---------------------------------------------------------------------------
// StartImage SSR regression
// ---------------------------------------------------------------------------
describe("StartImage SSR", () => {
  it("does not throw ReferenceError: document is not defined", () => {
    expect(() => {
      renderToString(() => (
        <StartImage
          src={{ source: "/test.jpg", width: 100, height: 100, options: {} }}
          alt="test"
          fallback={() => <div>loading</div>}
        />
      ));
    }).not.toThrow();
  });

  it("produces HTML containing the image container", () => {
    const html = renderToString(() => (
      <StartImage
        src={{ source: "/test.jpg", width: 100, height: 100, options: {} }}
        alt="test"
        fallback={() => <div>loading</div>}
      />
    ));

    expect(html).toContain('data-start-image');
    expect(html).toContain("test.jpg");
  });

  it("renders without a transformer (default <source> fallback path)", () => {
    const html = renderToString(() => (
      <StartImage
        src={{ source: "/hero.png", width: 800, height: 600, options: {} }}
        alt="hero image"
        fallback={() => <span>placeholder</span>}
      />
    ));

    expect(html).toContain("hero.png");
    expect(html).toContain('alt="hero image"');
  });
});
