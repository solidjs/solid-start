import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const FS_PREFIX = "/@fs/";

function canonicalPath(path: string): string {
  try {
    return realpathSync.native(path);
  } catch {
    return path;
  }
}

function filePathFromId(id: string): string | undefined {
  let filename = id.replace(/[?#].*$/s, "");

  if (filename.startsWith("\0")) return;
  if (filename.startsWith(FS_PREFIX)) filename = filename.slice(FS_PREFIX.length);
  if (filename.startsWith("file://")) filename = fileURLToPath(filename);

  return isAbsolute(filename) ? filename : undefined;
}

/**
 * Provides SolidStart's `~` app-root alias without claiming imports made by
 * workspace packages. Those packages may define their own `~` mapping through
 * an importer-aware resolver such as vite-tsconfig-paths.
 */
export function appRootAlias(projectRoot: string, appRoot: string): Plugin {
  const absoluteProjectRoot = resolve(projectRoot);
  const absoluteAppRoot = resolve(absoluteProjectRoot, appRoot);
  const canonicalProjectRoot = canonicalPath(absoluteProjectRoot);
  const packageRootCache = new Map<string, string | undefined>();

  function findPackageRoot(start: string): string | undefined {
    let directory = start;
    const visited: string[] = [];

    while (true) {
      if (packageRootCache.has(directory)) {
        const packageRoot = packageRootCache.get(directory);
        for (const visitedDirectory of visited) {
          packageRootCache.set(visitedDirectory, packageRoot);
        }
        return packageRoot;
      }

      visited.push(directory);
      if (existsSync(join(directory, "package.json"))) {
        const packageRoot = canonicalPath(directory);
        for (const visitedDirectory of visited) {
          packageRootCache.set(visitedDirectory, packageRoot);
        }
        return packageRoot;
      }

      const parent = dirname(directory);
      if (parent === directory) {
        for (const visitedDirectory of visited) {
          packageRootCache.set(visitedDirectory, undefined);
        }
        return;
      }
      directory = parent;
    }
  }

  const appPackageRoot = findPackageRoot(absoluteAppRoot);

  function isAppImporter(importer: string): boolean {
    const importerPath = filePathFromId(importer);
    if (!importerPath) return false;

    if (appPackageRoot) {
      return findPackageRoot(dirname(importerPath)) === appPackageRoot;
    }

    const relativeImporter = relative(canonicalProjectRoot, canonicalPath(importerPath));
    return (
      relativeImporter === "" ||
      (!relativeImporter.startsWith("..") && !isAbsolute(relativeImporter))
    );
  }

  return {
    name: "solid-start:app-root-alias",
    enforce: "pre",
    async resolveId(id, importer, options) {
      if (id !== "~" && !id.startsWith("~/")) return null;
      if (importer && !isAppImporter(importer)) return null;

      const target = id === "~" ? absoluteAppRoot : join(absoluteAppRoot, id.slice(2));
      return (await this.resolve(target, importer, { ...options, skipSelf: true })) ?? target;
    },
  };
}
