import type { JSX } from "solid-js";
import type { AspectRatio } from "./aspect-ratio";

function kebabify(str: string): string {
  return str
    .replace(/([A-Z])([A-Z])/g, "$1-$2")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function shimStyle(style: JSX.CSSProperties): JSX.CSSProperties {
  const keys = Object.keys(style) as (keyof JSX.CSSProperties)[];
  const newStyle: JSX.CSSProperties = {};

  for (let i = 0, len = keys.length; i < len; i += 1) {
    const key = kebabify(keys[i]!);
    newStyle[key as any] = style[keys[i]!];
  }
  return newStyle;
}

export function getAspectRatioBoxStyle(ratio: AspectRatio): JSX.CSSProperties {
  return {
    position: "relative",
    "padding-top": `${(ratio.height * 100) / ratio.width}%`,
    width: "100%",
    height: "0",
    overflow: "hidden",
  };
}

export const IMAGE_CONTAINER: JSX.CSSProperties = {
  width: "100%",
  height: "100%",
  position: "relative",
};

export const BLOCKER_STYLE: JSX.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export const IMAGE_STYLE: JSX.CSSProperties = {
  ...BLOCKER_STYLE,
  width: "100%",
  height: "100%",
  "object-fit": "contain",
  "pointer-events": "none",
  "user-select": "none",
};

export function getEmptySVGPlaceholder({ width, height }: AspectRatio): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" version="1.1"/>`;
}

export function getEncodedSVG(svg: string): string {
  const encodedSVG = encodeURIComponent(svg);
  return `data:image/svg+xml,${encodedSVG}`;
}

export function getEncodedOptionalSVG(ratio: AspectRatio, svg?: string): string {
  return getEncodedSVG(svg || getEmptySVGPlaceholder(ratio));
}

export function getEmptyImageURL(ratio: AspectRatio): string {
  return getEncodedOptionalSVG(ratio);
}
