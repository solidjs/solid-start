import sharp from "sharp";
import type { StartImageFormat } from "../types.ts";

export function transformImage(
  originalPath: string,
  targetFormat: StartImageFormat,
  size: number,
  quality: number,
) {
  const input = sharp(originalPath);
  switch (targetFormat) {
    case "avif":
      return input.resize(size).avif({
        quality,
      });
    case "jpeg":
      return input.resize(size).jpeg({
        quality,
      });
    case "png":
      return input.resize(size).png({
        quality,
      });
    case "webp":
      return input.resize(size).webp({
        quality,
      });
    case "tiff":
      return input.resize(size).tiff({
        quality,
      });
  }
}

interface ImageData {
  width: number;
  height: number;
}

export async function getImageData(originalPath: string): Promise<ImageData> {
  const result = await sharp(originalPath).metadata();
  return {
    width: result.width || 0,
    height: result.height || 0,
  };
}
