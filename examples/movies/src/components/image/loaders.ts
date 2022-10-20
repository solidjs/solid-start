import { warnOnce } from "./utils";
import { ImageLoaderPropsWithConfig, ImgElementWithDataProp, PlaceholderValue, OnLoadingComplete } from "./types";

// Do not export - this is an internal type only
// because `next.config.js` is only meant fdefaultLoaderor the
// built-in loaders, not for a custom loader() prop.
export function defaultLoader({
  config,
  src,
  width,
  quality,
}: ImageLoaderPropsWithConfig): string {
  if (import.meta.env.MODE !== "production") {
    const missingValues = [];

    // these should always be provided but make sure they are
    if (!src) missingValues.push("src");
    if (!width) missingValues.push("width");

    if (missingValues.length > 0) {
      throw new Error(
        `Next Image Optimization requires ${missingValues.join(
          ", "
        )} to be provided. Make sure you pass them as props to the \`next/image\` component. Received: ${JSON.stringify(
          { src, width, quality }
        )}`
      );
    }

    if (src.startsWith("//")) {
      throw new Error(
        `Failed to parse src "${src}" on \`next/image\`, protocol-relative URL (//) must be changed to an absolute URL (http:// or https://)`
      );
    }

    if (!src.startsWith("/") && (config.domains || config.remotePatterns)) {
      let parsedSrc: URL;
      try {
        parsedSrc = new URL(src);
      } catch (err) {
        console.error(err);
        throw new Error(
          `Failed to parse src "${src}" on \`next/image\`, if using relative image it must start with a leading slash "/" or be an absolute URL (http:// or https://)`
        );
      }

      // if (import.meta.env.MODE !== "test") {
      //   // We use dynamic require because this should only error in development
      //   const { hasMatch } = require("../../shared/lib/match-remote-pattern");
      //   if (!hasMatch(config.domains, config.remotePatterns, parsedSrc)) {
      //     throw new Error(
      //       `Invalid src prop (${src}) on \`next/image\`, hostname "${parsedSrc.hostname}" is not configured under images in your \`next.config.js\`\n` +
      //         `See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host`
      //     );
      //   }
      // }
    }
  }
  if (src.endsWith(".svg") && !config.dangerouslyAllowSVG) {
    // Special case to make svg serve as-is to avoid proxying
    // through the built-in Image Optimization API.
    return src;
  }
  return `${src}`;
}

// See https://stackoverflow.com/q/39777833/266535 for why we use this ref
// handler instead of the img's onLoad attribute.
export function handleLoading(
  img: ImgElementWithDataProp,
  src: string,
  placeholder: PlaceholderValue,
  onLoadingComplete: OnLoadingComplete | undefined,
  setBlurComplete: (b: boolean) => void
) {
  if (!img || img["data-loaded-src"] === src) {
    return;
  }
  img["data-loaded-src"] = src;
  const p = "decode" in img ? img.decode() : Promise.resolve();
  p.catch(() => {}).then(() => {
    if (!img.parentNode) {
      // Exit early in case of race condition:
      // - onload() is called
      // - decode() is called but incomplete
      // - unmount is called
      // - decode() completes
      return;
    }
    if (placeholder === "blur") {
      setBlurComplete(true);
    }
    if (onLoadingComplete) onLoadingComplete(img);
    if (import.meta.env.MODE !== "production") {
      if (img.getAttribute("data-nimg") === "future-fill") {
        if (
          !img.getAttribute("sizes") ||
          img.getAttribute("sizes") === "100vw"
        ) {
          let widthViewportRatio =
            img.getBoundingClientRect().width / window.innerWidth;
          if (widthViewportRatio < 0.6) {
            warnOnce(
              `Image with src "${src}" has "fill" but is missing "sizes" prop. Please add it to improve page performance. Read more: https://nextjs.org/docs/api-reference/next/future/image#sizes`
            );
          }
        }
        if (img.parentElement) {
          const { position } = window.getComputedStyle(img.parentElement);
          const valid = ["absolute", "fixed", "relative"];
          if (!valid.includes(position)) {
            warnOnce(
              `Image with src "${src}" has "fill" and parent element with invalid "position". Provided "${position}" should be one of ${valid
                .map(String)
                .join(",")}.`
            );
          }
        }
        if (img.height === 0) {
          warnOnce(
            `Image with src "${src}" has "fill" and a height value of 0. This is likely because the parent element of the image has not been styled to have a set height.`
          );
        }
      }
      const heightModified = img.height.toString() !== img.getAttribute("height");
      const widthModified = img.width.toString() !== img.getAttribute("width");
      if (
        (heightModified && !widthModified) ||
        (!heightModified && widthModified)
      ) {
        warnOnce(
          `Image with src "${src}" has either width or height modified, but not the other. If you use CSS to change the size of your image, also include the styles 'width: "auto"' or 'height: "auto"' to maintain the aspect ratio.`
        );
      }
    }
  });
}
