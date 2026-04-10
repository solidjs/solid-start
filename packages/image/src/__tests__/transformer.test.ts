import { describe, it, expect } from "vitest";
import {
  createImageVariants,
  mergeImageVariantsByType,
  mergeImageVariantsToSrcSet,
} from "../transformer";
import type {
  StartImageSource,
  StartImageTransformer,
  StartImageVariant,
} from "../types";

describe("createImageVariants", () => {
  it("returns an array with 1 item when transformer returns a single variant", () => {
    const source: StartImageSource<{}> = {
      source: "/img/photo.jpg",
      width: 800,
      height: 600,
      options: {},
    };

    const transformer: StartImageTransformer<{}> = {
      transform: () => ({
        path: "/img/photo-800.webp",
        width: 800,
        type: "image/webp",
      }),
    };

    const result = createImageVariants(source, transformer);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      path: "/img/photo-800.webp",
      width: 800,
      type: "image/webp",
    });
  });

  it("returns an array with 3 items when transformer returns 3 variants", () => {
    const source: StartImageSource<{}> = {
      source: "/img/hero.png",
      width: 1200,
      height: 800,
      options: {},
    };

    const variants: StartImageVariant[] = [
      { path: "/img/hero-400.avif", width: 400, type: "image/avif" },
      { path: "/img/hero-800.avif", width: 800, type: "image/avif" },
      { path: "/img/hero-1200.avif", width: 1200, type: "image/avif" },
    ];

    const transformer: StartImageTransformer<{}> = {
      transform: () => variants,
    };

    const result = createImageVariants(source, transformer);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      path: "/img/hero-400.avif",
      width: 400,
      type: "image/avif",
    });
    expect(result[1]).toEqual({
      path: "/img/hero-800.avif",
      width: 800,
      type: "image/avif",
    });
    expect(result[2]).toEqual({
      path: "/img/hero-1200.avif",
      width: 1200,
      type: "image/avif",
    });
  });

  it("passes the source to the transformer", () => {
    const source: StartImageSource<{ quality: number }> = {
      source: "/img/test.jpg",
      width: 500,
      height: 300,
      options: { quality: 80 },
    };

    let receivedSource: StartImageSource<{ quality: number }> | undefined;

    const transformer: StartImageTransformer<{ quality: number }> = {
      transform: (src) => {
        receivedSource = src;
        return { path: "/img/test-500.webp", width: 500, type: "image/webp" };
      },
    };

    createImageVariants(source, transformer);

    expect(receivedSource).toBe(source);
  });
});

describe("mergeImageVariantsByType", () => {
  it("groups variants by their MIME type", () => {
    const variants: StartImageVariant[] = [
      { path: "/img/a-400.webp", width: 400, type: "image/webp" },
      { path: "/img/a-800.webp", width: 800, type: "image/webp" },
      { path: "/img/a-400.avif", width: 400, type: "image/avif" },
      { path: "/img/a-800.avif", width: 800, type: "image/avif" },
    ];

    const result = mergeImageVariantsByType(variants);

    expect(result.size).toBe(2);

    const webpGroup = result.get("image/webp")!;
    expect(webpGroup).toHaveLength(2);
    expect(webpGroup[0]).toEqual({
      path: "/img/a-400.webp",
      width: 400,
      type: "image/webp",
    });
    expect(webpGroup[1]).toEqual({
      path: "/img/a-800.webp",
      width: 800,
      type: "image/webp",
    });

    const avifGroup = result.get("image/avif")!;
    expect(avifGroup).toHaveLength(2);
    expect(avifGroup[0]).toEqual({
      path: "/img/a-400.avif",
      width: 400,
      type: "image/avif",
    });
    expect(avifGroup[1]).toEqual({
      path: "/img/a-800.avif",
      width: 800,
      type: "image/avif",
    });
  });

  it("returns a Map with 1 entry when all variants share the same type", () => {
    const variants: StartImageVariant[] = [
      { path: "/img/x-100.png", width: 100, type: "image/png" },
      { path: "/img/x-200.png", width: 200, type: "image/png" },
    ];

    const result = mergeImageVariantsByType(variants);

    expect(result.size).toBe(1);
    expect(result.get("image/png")).toHaveLength(2);
  });
});

describe("mergeImageVariantsToSrcSet", () => {
  it("formats a single variant into a srcset string", () => {
    const variants: StartImageVariant[] = [
      { path: "/img/photo-100.webp", width: 100, type: "image/webp" },
    ];

    const result = mergeImageVariantsToSrcSet(variants);

    expect(result).toBe("/img/photo-100.webp 100w");
  });

  it("formats multiple variants into a comma-separated srcset string", () => {
    const variants: StartImageVariant[] = [
      { path: "/img/photo-100.webp", width: 100, type: "image/webp" },
      { path: "/img/photo-200.webp", width: 200, type: "image/webp" },
      { path: "/img/photo-400.webp", width: 400, type: "image/webp" },
    ];

    const result = mergeImageVariantsToSrcSet(variants);

    expect(result).toBe(
      "/img/photo-100.webp 100w,/img/photo-200.webp 200w,/img/photo-400.webp 400w",
    );
  });
});
