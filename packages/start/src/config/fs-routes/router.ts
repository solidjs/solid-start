import fg from "fast-glob";
import fs from "node:fs";
import micromatch from "micromatch";
import { posix } from "node:path";
import { parseSync } from "oxc-parser";
import { pathToRegexp } from "path-to-regexp";

import { normalizePath } from "vite";

export { pathToRegexp };

export const glob = (path: string) => fg.sync(path, { absolute: true });

export type FileSystemRouterConfig = { dir: string; extensions: string[] };
type Route = { path: string } & Record<string, any>;

export function cleanPath(src: string, config: FileSystemRouterConfig) {
  return src
    .slice(config.dir.length)
    .replace(new RegExp(`\.(${(config.extensions ?? []).join("|")})$`), "");
}

export function analyzeModule(src: string) {
  const result = parseSync(src, fs.readFileSync(src, "utf-8"), { lang: "tsx" });
  const error = result.errors[0];
  if (error) throw new SyntaxError(`Failed to parse ${src}:\n${error.codeframe || error.message}`);

  return result.module.staticExports.flatMap(({ entries }) =>
    entries.flatMap(entry => {
      const n = entry.exportName.kind === "Default" ? "default" : entry.exportName.name;
      return entry.isType || n === null
        ? []
        : [{ n, ln: entry.localName.name ?? entry.importName.name ?? n }];
    }),
  );
}

type RouterEvent = CustomEvent<{ route: string; type: "update" | "remove" | "add" }>;

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

    const exports = analyzeModule(src);

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
    const idx = this.routes.findIndex(r => r.path === route.path);
    if (idx >= 0) this.routes.splice(idx, 1);
    this.routes.push(route);

    return idx >= 0;
  }

  async addRoute(src: string) {
    src = normalizePath(src);
    if (this.isRoute(src)) {
      try {
        const route = this.toRoute(src);
        if (route) {
          this._addRoute(route);
          this.reload(route.path, "add");
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  reload(route: string, type: "update" | "remove" | "add") {
    this.dispatchEvent(
      new CustomEvent("reload", {
        detail: {
          route,
          type,
        },
      }),
    );
  }

  async updateRoute(src_: string) {
    const src = normalizePath(src_);
    if (this.isRoute(src)) {
      try {
        const route = this.toRoute(src);
        if (route) {
          const updated = this._addRoute(route);
          this.reload(route.path, updated ? "update" : "add");
        } else {
          this.removeRoute(src_);
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

      const idx = this.routes.findIndex(r => r.path === path);
      if (idx === -1) return;

      this.routes.splice(idx, 1);
      this.reload(path, "remove");
    }
  }

  on(type: string, cb: (evt: RouterEvent) => void) {
    this.addEventListener(type, cb as any);
    return () => this.removeEventListener(type, cb as any);
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
