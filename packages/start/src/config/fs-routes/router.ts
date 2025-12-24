import { init, parse } from "es-module-lexer";
import esbuild from "esbuild";
import fg from "fast-glob";
import fs from "fs";
import micromatch from "micromatch";
import { posix } from "path";
import { pathToRegexp } from "path-to-regexp";

import { normalize } from "node:path";

export { pathToRegexp };

export const glob = (path: string) => fg.sync(path, { absolute: true });

export type FileSystemRouterConfig = { dir: string; extensions: string[] };
type Route = { path: string } & Record<string, any>;

export function cleanPath(src: string, config: FileSystemRouterConfig) {
  return src
    .slice(config.dir.length)
    // replace double backslashes with single forward slashes (windows compatibility)
    .replace(/\\+/g, "/")
    .replace(/\/\/+/, "/")
    .replace(new RegExp(`\.(${(config.extensions ?? []).join("|")})$`), "");
}

export function analyzeModule(src: string) {
  return parse(
    esbuild.transformSync(fs.readFileSync(src, "utf-8"), {
      jsx: "transform",
      format: "esm",
      loader: "tsx",
    }).code,
    src,
  );
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

  toRoute(src: string): Route | undefined {
    let path = this.toPath(src);

    if (path === undefined) return;

    const [_, exports] = analyzeModule(src);

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
    src = normalize(src);
    if (this.isRoute(src)) {
      try {
        const route = this.toRoute(src);
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
    src = normalize(src);
    if (this.isRoute(src)) {
      try {
        const route = this.toRoute(src);
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
    src = normalize(src);
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
