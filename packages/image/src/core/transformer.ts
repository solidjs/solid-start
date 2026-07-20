import type {
  SolidImageFile,
  SolidImageFormat,
  SolidImageMIME,
  SolidImageSource,
  SolidImageTransformer,
  SolidImageVariant,
} from "./types";

const MIME_TO_FORMAT: Record<SolidImageMIME, SolidImageFormat> = {
  "image/avif": "avif",
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/tiff": "tiff",
};

export function getFormatFromMIME(mime: SolidImageMIME): SolidImageFormat {
  return MIME_TO_FORMAT[mime];
}

const FORMAT_TO_MIME: Record<SolidImageFormat, SolidImageMIME> = {
  avif: "image/avif",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  tiff: "image/tiff",
};

export function getMIMEFromFormat(format: SolidImageFormat): SolidImageMIME {
  return FORMAT_TO_MIME[format];
}

const FILE_TO_FORMAT: Record<SolidImageFile, SolidImageFormat> = {
  avif: "avif",
  jfif: "jpeg",
  jpeg: "jpeg",
  jpg: "jpeg",
  pjp: "jpeg",
  pjpeg: "jpeg",
  png: "png",
  webp: "webp",
  tif: "tiff",
  tiff: "tiff",
};

export function getFormatFromFile(file: SolidImageFile): SolidImageFormat {
  return FILE_TO_FORMAT[file];
}

const FORMAT_TO_FILES: Record<SolidImageFormat, SolidImageFile[]> = {
  avif: ["avif"],
  jpeg: ["jfif", "jpeg", "jpg", "pjp", "pjpeg"],
  png: ["png"],
  webp: ["webp"],
  tiff: ["tif", "tiff"],
};

export function getFilesFromFormat(format: SolidImageFormat): SolidImageFile[] {
  return FORMAT_TO_FILES[format];
}

const FORMAT_TO_OUTPUT: Record<SolidImageFormat, SolidImageFile> = {
  avif: "avif",
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  tiff: "tiff",
};

export function getOutputFileFromFormat(format: SolidImageFormat): SolidImageFile {
  return FORMAT_TO_OUTPUT[format];
}

function ensureArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

export function createImageVariants<T>(
  source: SolidImageSource<T>,
  transformer: SolidImageTransformer<T>,
): SolidImageVariant[] {
  return ensureArray(transformer.transform(source));
}

function variantToSrcSetPart(variant: SolidImageVariant): string {
  return variant.path + " " + variant.width + "w";
}

export function mergeImageVariantsToSrcSet(variants: SolidImageVariant[]): string {
  let result = variantToSrcSetPart(variants[0]!);

  for (let i = 1, len = variants.length; i < len; i++) {
    result += "," + variantToSrcSetPart(variants[i]!);
  }

  return result;
}

export function mergeImageVariantsByType(
  variants: SolidImageVariant[],
): Map<string, SolidImageVariant[]> {
  const map = new Map<string, SolidImageVariant[]>();

  for (let i = 0, len = variants.length; i < len; i++) {
    const current = variants[i]!;

    const arr = map.get(current.type) || [];
    arr.push(current);
    map.set(current.type, arr);
  }

  return map;
}
