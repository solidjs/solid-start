/**
 * List of supported image types
 *
 * Based on https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types
 */
export type SolidImageMIME =
  | "image/avif"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/tiff";

export type SolidImagePNG = "png";
export type SolidImageAVIF = "avif";
export type SolidImageJPEG = "jpg" | "jpeg" | "jfif" | "pjpeg" | "pjp";
export type SolidImageWebP = "webp";
export type SolidImageTIFF = "tiff" | "tif";

export type SolidImageFile =
  | SolidImageAVIF
  | SolidImageJPEG
  | SolidImagePNG
  | SolidImageWebP
  | SolidImageTIFF;

export type SolidImageFormat = "avif" | "jpeg" | "png" | "webp" | "tiff";

/**
 * A variant of an image source. This is used to transform a given source string
 * into a <source> element
 */
export interface SolidImageVariant {
  path: string;
  width: number;
  type: SolidImageMIME;
}

/**
 * An image source
 */
export interface SolidImageSource<T> {
  source: string;
  width: number;
  height: number;
  options: T;
}

/**
 * Transforms an image source into a set of image variants
 */
export interface SolidImageTransformer<T> {
  transform: (source: SolidImageSource<T>) => SolidImageVariant | SolidImageVariant[];
}
