import { isServer } from "solid-js/web";
import {
  GenImgAttrsData, GenImgAttrsResult, ImageConfig, StaticImageData, StaticImport,
  StaticRequire
} from "./types";

let warnOnce = (_: string) => {}
if (process.env.NODE_ENV !== 'production') {
  const warnings = new Set<string>()
  warnOnce = (msg: string) => {
    if (!warnings.has(msg)) {
      console.warn(msg)
    }
    warnings.add(msg)
  }
}
export { warnOnce };

export const VALID_LOADING_VALUES = ["lazy", "eager", undefined] as const;
export function isStaticRequire(
  src: StaticRequire | StaticImageData
): src is StaticRequire {
  return (src as StaticRequire).default !== undefined;
}
export function isStaticImageData(
  src: StaticRequire | StaticImageData
): src is StaticImageData {
  return (src as StaticImageData).src !== undefined;
}
export function isStaticImport(src: string | StaticImport): src is StaticImport {
  return (
    typeof src === "object" &&
    (isStaticRequire(src as StaticImport) ||
      isStaticImageData(src as StaticImport))
  );
}
export function getWidths(
  { deviceSizes, allSizes }: ImageConfig,
  width: number | undefined,
  sizes: string | undefined
): { widths: number[]; kind: "w" | "x" } {
  if (sizes) {
    // Find all the "vw" percent sizes used in the sizes prop
    const viewportWidthRe = /(^|\s)(1?\d?\d)vw/g;
    const percentSizes = [];
    for (let match; (match = viewportWidthRe.exec(sizes)); match) {
      percentSizes.push(parseInt(match[2]));
    }
    if (percentSizes.length) {
      const smallestRatio = Math.min(...percentSizes) * 0.01;
      return {
        widths: allSizes.filter((s) => s >= deviceSizes[0] * smallestRatio),
        kind: "w",
      };
    }
    return { widths: allSizes, kind: "w" };
  }
  if (typeof width !== "number") return { widths: deviceSizes, kind: "w" };
  const widths = [
    ...new Set(
      // > This means that most OLED screens that say they are 3x resolution,
      // > are actually 3x in the green color, but only 1.5x in the red and
      // > blue colors. Showing a 3x resolution image in the app vs a 2x
      // > resolution image will be visually the same, though the 3x image
      // > takes significantly more data. Even true 3x resolution screens are
      // > wasteful as the human eye cannot see that level of detail without
      // > something like a magnifying glass.
      // https://blog.twitter.com/engineering/en_us/topics/infrastructure/2019/capping-image-fidelity-on-ultra-high-resolution-devices.html
      [width, width * 2 /*, width * 3*/].map(
        (w) => allSizes.find((p) => p >= w) || allSizes[allSizes.length - 1]
      )
    ),
  ];
  return { widths, kind: "x" };
}
export function generateImgAttrs({
  config,
  src,
  unoptimized,
  width,
  quality,
  sizes,
  loader,
}: GenImgAttrsData): GenImgAttrsResult {
  if (unoptimized) {
    return { src, srcSet: undefined, sizes: undefined };
  }
  const { widths, kind } = getWidths(config, width, sizes);
  const last = widths.length - 1;
  return {
    sizes: !sizes && kind === "w" ? "100vw" : sizes,
    srcSet: widths
      .map(
        (w, i) =>
          `${loader({ config, src, quality, width: w })} ${
            kind === "w" ? w : i + 1
          }${kind}`
      )
      .join(", "),
    // It's intended to keep `src` the last attribute because React updates
    // attributes in order. If we keep `src` the first one, Safari will
    // immediately start to fetch `src`, before `sizes` and `srcSet` are even
    // updated by React. That causes multiple unnecessary requests if `srcSet`
    // and `sizes` are defined.
    // This bug cannot be reproduced in Chrome or Firefox.
    src: loader({ config, src, quality, width: widths[last] }),
  };
}
export function getInt(x: unknown): number | undefined {
  if (typeof x === "number" || typeof x === "undefined") {
    return x;
  }
  if (typeof x === "string" && /^[0-9]+$/.test(x)) {
    return parseInt(x, 10);
  }
  return NaN;
}
export const checkImage = ({ src, unoptimized, props, widthInt, heightInt, rest, loader, blurStyles, perfObserver, defaultLoader, config, qualityInt, allImgs }) => {
    if (!src) {
      // React doesn't show the stack trace and there's
      // no `src` to help identify which image, so we
      // instead console.error(ref) during mount.
      unoptimized = true;
    } else {
      if (props.fill) {
        if (props.width) {
          throw new Error(
            `Image with src "${src}" has both "width" and "fill" properties. Only one should be used.`
          );
        }
        if (props.height) {
          throw new Error(
            `Image with src "${src}" has both "height" and "fill" properties. Only one should be used.`
          );
        }
        if (props.style instanceof Object) {
          if (props.style.position && props.style.position !== "absolute") {
            throw new Error(
              `Image with src "${src}" has both "fill" and "style.position" properties. Images with "fill" always use position absolute - it cannot be modified.`
            );
          }
          if (props.style.width && props.style.width !== "100%") {
            throw new Error(
              `Image with src "${src}" has both "fill" and "style.width" properties. Images with "fill" always use width 100% - it cannot be modified.`
            );
          }
          if (props.style.height && props.style.height !== "100%") {
            throw new Error(
              `Image with src "${src}" has both "fill" and "style.height" properties. Images with "fill" always use height 100% - it cannot be modified.`
            );
          }
        }
      } else {
        if (typeof widthInt === "undefined") {
          throw new Error(
            `Image with src "${src}" is missing required "width" property.`
          );
        } else if (isNaN(widthInt)) {
          throw new Error(
            `Image with src "${src}" has invalid "width" property. Expected a numeric value in pixels but received "${props.width}".`
          );
        }
        if (typeof heightInt === "undefined") {
          throw new Error(
            `Image with src "${src}" is missing required "height" property.`
          );
        } else if (isNaN(heightInt)) {
          throw new Error(
            `Image with src "${src}" has invalid "height" property. Expected a numeric value in pixels but received "${props.height}".`
          );
        }
      }
    }
    if (!VALID_LOADING_VALUES.includes(props.loading)) {
      throw new Error(
        `Image with src "${src}" has invalid "loading" property. Provided "${
          props.loading
        }" should be one of ${VALID_LOADING_VALUES.map(String).join(",")}.`
      );
    }
    if (props.priority && props.loading === "lazy") {
      throw new Error(
        `Image with src "${src}" has both "priority" and "loading='lazy'" properties. Only one should be used.`
      );
    }
    if (props.placeholder === "blur") {
      if (widthInt && heightInt && widthInt * heightInt < 1600) {
        warnOnce(
          `Image with src "${src}" is smaller than 40x40. Consider removing the "placeholder='blur'" property to improve performance.`
        );
      }
      // if (!blurStyles) {
      //   const VALID_BLUR_EXT = ["jpeg", "png", "webp", "avif"]; // should match next-image-loader
      //   throw new Error(
      //     `Image with src "${src}" has "placeholder='blur'" property but is missing the "blurDataURL" property.
      //     Possible solutions:
      //       - Add a "blurDataURL" property, the contents should be a small Data URL to represent the image
      //       - Change the "src" property to a static import with one of the supported file types: ${VALID_BLUR_EXT.join(
      //         ","
      //       )}
      //       - Remove the "placeholder" property, effectively no blur effect
      //     Read more: https://nextjs.org/docs/messages/placeholder-blur-data-url`
      //   );
      // }
    }
    if ("ref" in rest) {
      warnOnce(
        `Image with src "${src}" is using unsupported "ref" property. Consider using the "onLoadingComplete" property instead.`
      );
    }
    if (!unoptimized && loader !== defaultLoader) {
      const urlStr = loader({
        config: config(),
        src,
        width: widthInt || 400,
        quality: qualityInt || 75,
      });
      let url: URL | undefined;
      try {
        url = new URL(urlStr);
      } catch (err) {}
      if (urlStr === src || (url && url.pathname === src && !url.search)) {
        warnOnce(
          `Image with src "${src}" has a "loader" property that does not implement width. Please implement it or use the "unoptimized" property instead.` +
            `\nRead more: https://nextjs.org/docs/messages/next-image-missing-loader-width`
        );
      }
    }
    // Run performance validation for FCP and warn user
    if (!isServer) {
      perfObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // @ts-ignore - missing "LargestContentfulPaint" class with "element" prop
          const imgSrc = entry?.element?.src || "";
          const lcpImage = allImgs.get(imgSrc);
          if (
            lcpImage &&
            !lcpImage.priority &&
            lcpImage.placeholder !== "blur" &&
            !lcpImage.src.startsWith("data:") &&
            !lcpImage.src.startsWith("blob:")
          ) {
            // https://web.dev/lcp/#measure-lcp-in-javascript
            warnOnce(
              `Image with src "${lcpImage.src}" was detected as the Largest Contentful Paint (LCP). Please add the "priority" property if this image is above the fold.` +
                `\nRead more: https://nextjs.org/docs/api-reference/next/image#priority`
            );
          }
        }
      });
      try {
        perfObserver.observe({
          type: "largest-contentful-paint",
          buffered: true,
        });
      } catch (err) {
        // Log error but don't crash the app
        console.error(err);
      }
    }
};
