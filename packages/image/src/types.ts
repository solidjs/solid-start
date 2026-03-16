/**
 * List of supported image types
 *
 * Based on https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types
 */
export type StartImageMIME =
  | "image/avif"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/tiff";

export type StartImagePNG = "png";
export type StartImageAVIF = "avif";
export type StartImageJPEG = "jpg" | "jpeg" | "jfif" | "pjpeg" | "pjp";
export type StartImageWebP = "webp";
export type StartImageTIFF = "tiff" | "tif";

export type StartImageFile =
  | StartImageAVIF
  | StartImageJPEG
  | StartImagePNG
  | StartImageWebP
  | StartImageTIFF;

export type StartImageFormat = "avif" | "jpeg" | "png" | "webp" | "tiff";

/**
 * A variant of an image source. This is used to transform a given source string
 * into a <source> element
 */
export interface StartImageVariant {
  path: string;
  width: number;
  type: StartImageMIME;
}

/**
 * An image source
 */
export interface StartImageSource<T> {
  source: string;
  width: number;
  height: number;
  options: T;
}

/**
 * Transforms an image source into a set of image variants
 */
export interface StartImageTransformer<T> {
  transform: (source: StartImageSource<T>) => StartImageVariant | StartImageVariant[];
}
