import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { normalizePath, type Plugin } from "vite";

/**
 * Provides SolidStart's `~` app-root alias without claiming imports made by
 * other workspace packages. Those packages may define their own `~` mapping
 * through an importer-aware resolver such as vite-tsconfig-paths.
 */
export function appRootAlias(projectRoot: string, appRoot: string): Plugin {
  const appDir = normalizePath(resolve(projectRoot, appRoot));
  const packageRoots = new Map<string, string | undefined>();

  /** Nearest directory at or above `directory` that holds a `package.json`. */
  function packageRoot(directory: string): string | undefined {
    if (!packageRoots.has(directory)) {
      const parent = dirname(directory);
      packageRoots.set(
        directory,
        existsSync(join(directory, "package.json"))
          ? directory
          : parent === directory
            ? undefined
            : packageRoot(parent),
      );
    }
    return packageRoots.get(directory);
  }

  const appPackage = packageRoot(appDir);

  /** True only when the importer demonstrably belongs to another package. */
  function isForeignImporter(importer: string) {
    const file = normalizePath(importer.replace(/[?#].*$/s, ""));
    if (!isAbsolute(file)) return false;
    const owner = packageRoot(dirname(file));
    return owner !== undefined && owner !== appPackage;
  }

  return {
    name: "solid-start:app-root-alias",
    enforce: "pre",
    async resolveId(id, importer, options) {
      if (id !== "~" && !id.startsWith("~/")) return null;
      if (importer && isForeignImporter(importer)) return null;

      const target = join(appDir, id.slice(1));
      return (await this.resolve(target, importer, { ...options, skipSelf: true })) ?? target;
    },
  };
}
