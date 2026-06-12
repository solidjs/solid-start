import { init, parse } from "es-module-lexer";
import esbuild from "esbuild";
import fg from "fast-glob";
import fs from "node:fs";
import micromatch from "micromatch";
import { posix } from "node:path";
import { pathToRegexp } from "path-to-regexp";

import { normalizePath } from "vite";

export { pathToRegexp };

export const glob = (path: string) => fg.sync(path, { absolute: true });

/**
 * Transforms a route module's source into JS/TS/TSX before export analysis.
 * Route modules are parsed with esbuild's tsx loader to enumerate their
 * exports (for `?pick=` tree-shaking); languages that *compile to* JS/TS —
 * Civet, CoffeeScript, etc. — can't be parsed directly, so their bundler
 * plugin (or the user) supplies a transform keyed by extension.
 */
export type RouteModuleTransform = (
  code: string,
  sourcePath: string,
) => string | Promise<string>;

export type FileSystemRouterConfig = {
  dir: string;
  extensions: string[];
  /** Per-extension (without dot) source transforms for route export analysis. */
  routeTransforms?: Record<string, RouteModuleTransform>;
};
type Route = { path: string } & Record<string, any>;

export function cleanPath(src: string, config: FileSystemRouterConfig) {
  return src
    .slice(config.dir.length)
    .replace(new RegExp(`\.(${(config.extensions ?? []).join("|")})$`), "");
}

export function analyzeCode(code: string, sourcePath: string) {
  return parse(
    esbuild.transformSync(code, {
      jsx: "transform",
      format: "esm",
      loader: "tsx",
    }).code,
    sourcePath,
  );
}

export function analyzeModule(src: string) {
  return analyzeCode(fs.readFileSync(src, "utf-8"), src);
}

/**
 * Like analyzeModule, but applies the configured per-extension transform
 * first so non-TS route languages can be analyzed.
 */
export async function analyzeRouteModule(sourcePath: string, config: FileSystemRouterConfig) {
  const transform = config.routeTransforms?.[sourcePath.slice(sourcePath.lastIndexOf(".") + 1)];
  if (!transform) return analyzeModule(sourcePath);
  // parse() requires the lexer wasm to be initialized; buildRoutes awaits
  // this before the initial scan, but watcher updates can arrive earlier.
  await init;
  return analyzeCode(await transform(fs.readFileSync(sourcePath, "utf-8"), sourcePath), sourcePath);
}

export class BaseFileSystemRouter extends EventTarget {
  routes: Route[];

  config: FileSystemRouterConfig;

  /**
   *
   * @param {} config
   */
  constructor(config: FileSystemRouterConfig) {
    super();
    this.routes = [];
    this.config = config;
  }

  glob() {
    return (
      posix.join(fg.convertPathToPattern(this.config.dir), "**/*") +
      `.{${this.config.extensions.join(",")}}`
    );
  }

  async buildRoutes(): Promise<any[]> {
    await init;
    for (var src of glob(this.glob())) {
      await this.addRoute(src);
    }

    return this.routes;
  }

  isRoute(src: string) {
    return Boolean(micromatch(src as any, this.glob())?.length);
  }

  toPath(src: string) {
    throw new Error("Not implemented");
  }

  async toRoute(src: string): Promise<Route | undefined> {
    let path = this.toPath(src);

    if (path === undefined) return;

    const [_, exports] = await analyzeRouteModule(src, this.config);

    if (!exports.find(e => e.n === "default")) {
      console.warn("No default export", src);
    }

    return {
      $component: {
        src: src,
        pick: ["default", "$css"],
      },
      path,
      // filePath: src
    };
  }

  /**
   * To be attached by vite plugin to the vite dev server
   */
  update = undefined;

  _addRoute(route: Route) {
    this.routes = this.routes.filter(r => r.path !== route.path);
    this.routes.push(route);
  }

  async addRoute(src: string) {
    src = normalizePath(src);
    if (this.isRoute(src)) {
      try {
        const route = await this.toRoute(src);
        if (route) {
          this._addRoute(route);
          this.reload(route.path);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  reload(route: string) {
    this.dispatchEvent(
      new Event("reload", {
        // @ts-ignore
        detail: {
          route,
        },
      }),
    );
  }

  async updateRoute(src: string) {
    src = normalizePath(src);
    if (this.isRoute(src)) {
      try {
        const route = await this.toRoute(src);
        if (route) {
          this._addRoute(route);
          this.reload(route.path);
        }
      } catch (e) {
        console.error(e);
      }
      // this.update?.();
    }
  }

  removeRoute(src: string) {
    src = normalizePath(src);
    if (this.isRoute(src)) {
      const path = this.toPath(src);
      if (path === undefined) {
        return;
      }
      this.routes = this.routes.filter(r => r.path !== path);
      this.dispatchEvent(new Event("reload", {}));
    }
  }

  buildRoutesPromise?: Promise<any[]>;

  async getRoutes() {
    if (!this.buildRoutesPromise) {
      this.buildRoutesPromise = this.buildRoutes();
    }
    await this.buildRoutesPromise;
    return this.routes;
  }
}
