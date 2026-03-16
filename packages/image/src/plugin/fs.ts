import type { Abortable } from "node:events";
import type { Mode, ObjectEncodingOptions, OpenMode } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type { Stream } from "node:stream";

export async function removeFile(filePath: string): Promise<void> {
  return await fs.rm(filePath, { recursive: true, force: true });
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p);

    return stat.isFile();
  } catch {
    return false;
  }
}

const PATH_FILTER = /[<>:"|?*]/;

export function checkPath(pth: string) {
  if (process.platform === "win32") {
    const pathHasInvalidWinCharacters = PATH_FILTER.test(pth.replace(path.parse(pth).root, ""));

    if (pathHasInvalidWinCharacters) {
      const error = new Error(`Path contains invalid characters: ${pth}`);
      throw error;
    }
  }
}

export async function makeDir(dir: string, mode = 0o777) {
  checkPath(dir);
  return await fs.mkdir(dir, {
    mode,
    recursive: true,
  });
}

export async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function outputFile(
  file: string,
  data:
    | string
    | NodeJS.ArrayBufferView
    | Iterable<string | NodeJS.ArrayBufferView>
    | AsyncIterable<string | NodeJS.ArrayBufferView>
    | Stream,
  encoding?:
    | (ObjectEncodingOptions & {
        mode?: Mode | undefined;
        flag?: OpenMode | undefined;
      } & Abortable)
    | BufferEncoding
    | null,
) {
  const dir = path.dirname(file);
  if (!(await pathExists(dir))) {
    await makeDir(dir);
  }
  return fs.writeFile(file, data, encoding);
}
