import type { StaticExportEntry } from "oxc-parser";

import {
  analyzeModule,
  BaseFileSystemRouter,
  cleanPath,
  type FileSystemRouterConfig,
} from "./fs-routes/router.ts";

export class SolidStartClientFileRouter extends BaseFileSystemRouter {
  toPath(src: string) {
    const routePath = cleanPath(src, this.config)
      // remove the initial slash
      .slice(1)
      .replace(/index$/, "")
      .replace(/\[([^/]+)\]/g, (_, m) => {
        if (m.length > 3 && m.startsWith("...")) {
          return `*${m.slice(3)}`;
        }
        if (m.length > 2 && m.startsWith("[") && m.endsWith("]")) {
          return `:${m.slice(1, -1)}?`;
        }
        return `:${m}`;
      });

    return routePath?.length > 0 ? `/${routePath}` : "/";
  }

  toRoute(src: string) {
    const path = this.toPath(src);

    if (src.endsWith(".md") || src.endsWith(".mdx")) {
      return {
        page: true,
        $component: {
          src: src,
          pick: ["$css"],
        },
        $$route: undefined,
        path,
        // filePath: src
      };
    }

    const exports = analyzeModule(src);
    const exportNames = exports.map(getExportName);
    const localExportNames = exports.map(getLocalExportName).filter(name => name !== undefined);
    const hasDefault = exportNames.includes("default");
    const hasRouteConfig = exportNames.includes("route");
    if (hasDefault) {
      return {
        page: true,
        $component: {
          src: src,
          pick: [...localExportNames.filter(name => name !== "route"), "default", "$css"],
        },
        $$route: hasRouteConfig
          ? {
              src: src,
              pick: ["route"],
            }
          : undefined,
        path,
        // filePath: src
      };
    }
  }
}

const HTTP_METHODS = ["HEAD", "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];

function getExportName(entry: StaticExportEntry) {
  return entry.exportName.name ?? "default";
}

function getLocalExportName(entry: StaticExportEntry) {
  const name = getExportName(entry);
  if (name === "default") return;
  return name === (entry.localName.name ?? entry.importName.name ?? name) ? name : undefined;
}

function createHTTPHandlers(src: string, exports: readonly string[]) {
  const handlers: Record<string, any> = {};
  for (const exp of exports) {
    if (HTTP_METHODS.includes(exp)) {
      handlers[`$${exp}`] = {
        src: src,
        pick: [exp],
      };
      if (exp === "GET" && !exports.includes("HEAD")) {
        handlers.$HEAD = {
          src: src,
          pick: [exp],
        };
      }
    }
  }

  return handlers;
}

export class SolidStartServerFileRouter extends BaseFileSystemRouter {
  declare config: FileSystemRouterConfig & { dataOnly?: boolean };

  constructor(config: FileSystemRouterConfig & { dataOnly?: boolean }) {
    super(config);
  }

  toPath(src: string) {
    const routePath = cleanPath(src, this.config)
      // remove the initial slash
      .slice(1)
      .replace(/index$/, "")
      .replace(/\[([^/]+)\]/g, (_, m) => {
        if (m.length > 3 && m.startsWith("...")) {
          return `*${m.slice(3)}`;
        }
        if (m.length > 2 && m.startsWith("[") && m.endsWith("]")) {
          return `:${m.slice(1, -1)}?`;
        }
        return `:${m}`;
      });

    return routePath?.length > 0 ? `/${routePath}` : "/";
  }

  toRoute(src: string) {
    const path = this.toPath(src);
    if (src.endsWith(".md") || src.endsWith(".mdx")) {
      return {
        page: true,
        $component: {
          src: src,
          pick: ["$css"],
        },
        $$route: undefined,
        path,
      };
    }

    const exports = analyzeModule(src);
    const exportNames = exports.map(getExportName);
    const localExportNames = exports.map(getLocalExportName).filter(name => name !== undefined);
    const hasRouteConfig = exportNames.includes("route");
    const hasDefault = exportNames.includes("default");
    const hasAPIRoutes = exportNames.some(name => HTTP_METHODS.includes(name));
    if (hasDefault || hasAPIRoutes) {
      return {
        page: hasDefault,
        $component:
          !this.config.dataOnly && hasDefault
            ? {
                src: src,
                pick: [
                  ...localExportNames.filter(
                    name => name !== "route" && !HTTP_METHODS.includes(name),
                  ),
                  "default",
                  "$css",
                ],
              }
            : undefined,
        $$route: hasRouteConfig
          ? {
              src: src,
              pick: ["route"],
            }
          : undefined,
        ...createHTTPHandlers(src, exportNames),
        path,
      };
    }
  }
}
