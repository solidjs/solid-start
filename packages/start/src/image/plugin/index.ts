import path from "node:path";
import { Plugin } from "vite";
import { getFilesFromFormat, getMIMEFromFormat, getOutputFileFromFormat } from "../transformer.ts";
import type { StartImageFile, StartImageFormat, StartImageVariant } from "../types.ts";
import { outputFile } from "./fs.ts";
import { getImageData, transformImage } from "./transformers.ts";
import xxHash32 from "./xxhash32.ts";

const DEFAULT_INPUT: StartImageFormat[] = ["png", "jpeg", "webp"];
const DEFAULT_OUTPUT: StartImageFormat[] = ["png", "jpeg", "webp"];
const DEFAULT_QUALITY = 0.8;

type MaybePromise<T> = T | Promise<T>;

export interface StartImageOptions {
  local?: {
    sizes: number[];
    input?: StartImageFormat[];
    output?: StartImageFormat[];
    quality: number;
    publicPath?: string;
  };
  remote?: {
    transformURL(url: string): MaybePromise<{
      src: {
        source: string;
        width: number;
        height: number;
      };
      variants: StartImageVariant | StartImageVariant[];
    }>;
  };
}

function getValidFileExtensions(formats: StartImageFormat[]): Set<string> {
  const result = new Set<StartImageFile>();
  for (const format of formats) {
    for (const file of getFilesFromFormat(format)) {
      result.add(file);
    }
  }
  return result;
}

function isValidFileExtension(extensions: Set<string>, target: string): target is StartImageFile {
  return extensions.has(target);
}

async function getImageSource(imagePath: string, relativePath: string): Promise<string> {
  // TODO add format variation
  const imageData = await getImageData(imagePath);
  return `
import source from ${JSON.stringify(relativePath)};
export default {
  width: ${JSON.stringify(imageData.width)},
  height: ${JSON.stringify(imageData.height)},
  source,
};
`;
}

function getImageTransformer(imagePath: string, outputTypes: string[], sizes: number[]): string {
  let imported = "";
  let exported = "";

  for (const format of outputTypes) {
    for (const size of sizes) {
      const variantName = "variant_" + format + "_" + size;
      const importPath = JSON.stringify(imagePath + "?start-image-" + format + "-" + size);
      imported += "import " + variantName + " from " + importPath + ";\n";
      exported += variantName + ",";
    }
  }

  return (
    imported +
    "const variants = [" +
    exported +
    "];\n" +
    "export default { transform() { return variants; }};"
  );
}

function getImageVariant(imagePath: string, target: StartImageFormat, size: number): string {
  return `import source from ${JSON.stringify(imagePath + "?start-image-raw-" + target + "-" + size)};
export default {
  width: ${size},
  type: '${getMIMEFromFormat(target)}',
  path: source,
};`;
}

function getImageEntryPoint(imagePath: string): string {
  return `import src from ${JSON.stringify(imagePath + "?start-image-source")};
import transformer from ${JSON.stringify(imagePath + "?start-image-transformer")};

export default { src, transformer };
`;
}

const LOCAL_PATH = /\?start-image(-[a-z]+(-[0-9]+)?)?/;
const REMOTE_PATH = "start-image:";

export const imagePlugin = (options: StartImageOptions) => {
  const plugins: Plugin[] = [];
  if (options.remote) {
    const transformUrl = options.remote.transformURL;
    plugins.push({
      name: "start-image/remote",
      enforce: "pre",
      resolveId(id) {
        if (id.startsWith(REMOTE_PATH)) {
          return id;
        }
        return null;
      },
      async load(id) {
        if (id.startsWith(REMOTE_PATH)) {
          const param = id.substring(REMOTE_PATH.length);

          const result = await transformUrl(param);

          return `const VARIANTS = ${JSON.stringify(result.variants)};
export default {
  src: ${JSON.stringify(result.src)},
  transformer: {
    transform() {
      return VARIANTS;
    },
  },
};`;
        }
        return null;
      },
    });
  }
  if (options.local) {
    const inputFormat = options.local.input ?? DEFAULT_INPUT;
    const outputFormat = options.local.output ?? DEFAULT_OUTPUT;
    const quality = options.local.quality ?? DEFAULT_QUALITY;
    const sizes = options.local.sizes;
    const publicPath = options.local.publicPath ?? "dist";

    const validInputFileExtensions = getValidFileExtensions(inputFormat);

    plugins.push({
      name: "start-image/local",
      enforce: "pre",
      resolveId(id, importer) {
        if (LOCAL_PATH.test(id) && importer) {
          return path.join(path.dirname(importer), id);
        }
        return null;
      },
      async load(id) {
        if (id.startsWith("\0")) {
          return null;
        }
        const { dir, name, ext } = path.parse(id);
        const [actualExtension, condition] = ext.substring(1).split("?");
        // Check if extension is valid
        if (!isValidFileExtension(validInputFileExtensions, actualExtension!)) {
          return null;
        }
        if (!condition) {
          return null;
        }
        const originalPath = `${dir}/${name}.${actualExtension}`;
        const relativePath = `./${name}.${actualExtension}`;
        // Get the true source
        if (condition.startsWith("start-image-source")) {
          return await getImageSource(originalPath, relativePath);
        }
        // Get the transformer file
        if (condition.startsWith("start-image-transformer")) {
          return getImageTransformer(relativePath, outputFormat, sizes);
        }
        // Image transformer variant
        if (condition.startsWith("start-image-raw")) {
          const [, , format, size] = condition.split("-");
          const hash = xxHash32(originalPath).toString(16);
          const filename = `i-${hash}-${size}.${getOutputFileFromFormat(format as StartImageFormat)}`;
          const image = transformImage(originalPath, format as StartImageFormat, +size!, quality);
          const buffer = await image.toBuffer();
          const basePath = path.join(".start-image", filename);
          const targetPath = path.join(publicPath, basePath);
          await outputFile(targetPath, buffer);
          return `export default "/${basePath}"`;
        }
        // Image transformer variant
        if (condition.startsWith("start-image-")) {
          const [, format, size] = condition.split("-");

          return getImageVariant(relativePath, format as StartImageFormat, +size!);
        }
        if (condition.startsWith("start-image")) {
          return getImageEntryPoint(relativePath);
        }
        return null;
      },
    });
  }

  return plugins;
};
