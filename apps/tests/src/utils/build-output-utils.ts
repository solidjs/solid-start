import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { brotliDecompressSync, gunzipSync } from "node:zlib";

export function getBuildOutputDirs() {
  const appRoot = process.cwd();
  const sourceRoot = path.join(appRoot, "src");
  const serverOutputRoot = path.join(appRoot, ".output/server");
  const clientOutputRoot = path.join(appRoot, ".output/public");

  if (!existsSync(sourceRoot)) {
    throw new Error(`Source dir not found: ${sourceRoot}`);
  }

  if (!existsSync(serverOutputRoot)) {
    throw new Error(
      `Server output dir not found: ${serverOutputRoot}. Did you run the build? (pnpm --filter tests run build)`,
    );
  }

  if (!existsSync(clientOutputRoot)) {
    throw new Error(
      `Client output dir not found: ${clientOutputRoot}. Did you run the build? (pnpm --filter tests run build)`,
    );
  }

  return {
    sourceRoot,
    serverOutputRoot,
    clientOutputRoot,
  };
}

export async function getFiles(dir: string, fileRegex: RegExp): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });

  return entries
    .filter(e => e.isFile() && fileRegex.test(e.name))
    .map(e => path.join(e.parentPath, e.name));
}

export async function readFileContent(filePath: string) {
  if (filePath.endsWith(".br")) {
    return brotliDecompressSync(await readFile(filePath)).toString("utf-8");
  }

  if (filePath.endsWith(".gz")) {
    return gunzipSync(await readFile(filePath)).toString("utf-8");
  }

  return readFile(filePath, "utf-8");
}
