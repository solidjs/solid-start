import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { normalizePath, type Plugin } from "vite";

/**
 * `~/app.css`, `~/logo.svg`, ... but not `~/lib/api.ts` or `~/components/Counter`.
 *
 * CSS `@import`, `url()`, preprocessor imports and `new URL(..., import.meta.url)`
 * are resolved by internal Vite resolvers that only run the alias plugin, never
 * user plugins, so those ids can never reach `resolveId` below. Keeping non-module
 * ids on a plain alias preserves `~` in stylesheets and asset URLs, where it always
 * means the app root.
 */
const NON_MODULE_ID = /^~\/([^?#]*\.(?![cm]?[jt]sx?(?:[?#]|$))[^./?#]+(?:[?#].*)?)$/;

/**
 * Provides SolidStart's `~` app-root alias without claiming module imports made
 * by other workspace packages. Those packages may map `~` to their own root
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
    config() {
      return { resolve: { alias: [{ find: NON_MODULE_ID, replacement: `${appDir}/$1` }] } };
    },
    async resolveId(id, importer, options) {
      if (id !== "~" && !id.startsWith("~/")) return null;
      if (importer && isForeignImporter(importer)) return null;

      const target = join(appDir, id.slice(1));
      return (await this.resolve(target, importer, { ...options, skipSelf: true })) ?? target;
    },
  };
}
