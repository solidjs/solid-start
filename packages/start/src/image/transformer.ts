import type {
  StartImageFile,
  StartImageFormat,
  StartImageMIME,
  StartImageSource,
  StartImageTransformer,
  StartImageVariant,
} from "./types";

const MIME_TO_FORMAT: Record<StartImageMIME, StartImageFormat> = {
  "image/avif": "avif",
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/tiff": "tiff",
};

export function getFormatFromMIME(mime: StartImageMIME): StartImageFormat {
  return MIME_TO_FORMAT[mime];
}

const FORMAT_TO_MIME: Record<StartImageFormat, StartImageMIME> = {
  avif: "image/avif",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  tiff: "image/tiff",
};

export function getMIMEFromFormat(format: StartImageFormat): StartImageMIME {
  return FORMAT_TO_MIME[format];
}

const FILE_TO_FORMAT: Record<StartImageFile, StartImageFormat> = {
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

export function getFormatFromFile(file: StartImageFile): StartImageFormat {
  return FILE_TO_FORMAT[file];
}

const FORMAT_TO_FILES: Record<StartImageFormat, StartImageFile[]> = {
  avif: ["avif"],
  jpeg: ["jfif", "jpeg", "jpg", "pjp", "pjpeg"],
  png: ["png"],
  webp: ["webp"],
  tiff: ["tif", "tiff"],
};

export function getFilesFromFormat(format: StartImageFormat): StartImageFile[] {
  return FORMAT_TO_FILES[format];
}

const FORMAT_TO_OUTPUT: Record<StartImageFormat, StartImageFile> = {
  avif: "avif",
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  tiff: "tiff",
};

export function getOutputFileFromFormat(format: StartImageFormat): StartImageFile {
  return FORMAT_TO_OUTPUT[format];
}

function ensureArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
}

export function createImageVariants<T>(
  source: StartImageSource<T>,
  transformer: StartImageTransformer<T>,
): StartImageVariant[] {
  return ensureArray(transformer.transform(source));
}

function variantToSrcSetPart(variant: StartImageVariant): string {
  return variant.path + " " + variant.width + "w";
}

export function mergeImageVariantsToSrcSet(variants: StartImageVariant[]): string {
  let result = variantToSrcSetPart(variants[0]!);

  for (let i = 1, len = variants.length; i < len; i++) {
    result += "," + variantToSrcSetPart(variants[i]!);
  }

  return result;
}

export function mergeImageVariantsByType(
  variants: StartImageVariant[],
): Map<string, StartImageVariant[]> {
  const map = new Map<string, StartImageVariant[]>();

  for (let i = 0, len = variants.length; i < len; i++) {
    const current = variants[i]!;

    const arr = map.get(current.type) || [];
    arr.push(current);
    map.set(current.type, arr);
  }

  return map;
}
