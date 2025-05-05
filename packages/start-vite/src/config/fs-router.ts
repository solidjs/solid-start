import { ExportSpecifier } from "es-module-lexer";
import {
  analyzeModule,
  BaseFileSystemRouter,
  cleanPath,
  FileSystemRouterConfig
} from "./fs-routes/router.js";

export class SolidStartClientFileRouter extends BaseFileSystemRouter {
  toPath(src: string) {
    const routePath = cleanPath(src, this.config)
      // remove the initial slash
      .slice(1)
      .replace(/index$/, "")
      .replace(/\[([^\/]+)\]/g, (_, m) => {
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
    let path = this.toPath(src);

    if (src.endsWith(".md") || src.endsWith(".mdx")) {
      return {
        page: true,
        $component: {
          src: src,
          pick: ["$css"]
        },
        $$route: undefined,
        path,
        filePath: src
      };
    }

    const [_, exports] = analyzeModule(src);
    const hasDefault = !!exports.find(e => e.n === "default");
    const hasRouteConfig = !!exports.find(e => e.n === "route");
    if (hasDefault) {
      return {
        page: true,
        $component: {
          src: src,
          pick: ["default", "$css"]
        },
        $$route: hasRouteConfig
          ? {
              src: src,
              pick: ["route"]
            }
          : undefined,
        path,
        filePath: src
      };
    }
  }
}

const HTTP_METHODS = ["HEAD", "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
function createHTTPHandlers(src: string, exports: readonly ExportSpecifier[]) {
  const handlers: Record<string, any> = {};
  for (const exp of exports) {
    if (HTTP_METHODS.includes(exp.n)) {
      handlers[`$${exp.n}`] = {
        src: src,
        pick: [exp.n]
      };
      if (exp.n === "GET" && !exports.find(exp => exp.n === "HEAD")) {
        handlers.$HEAD = {
          src: src,
          pick: [exp.n]
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
      .replace(/\[([^\/]+)\]/g, (_, m) => {
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
    let path = this.toPath(src);
    if (src.endsWith(".md") || src.endsWith(".mdx")) {
      return {
        page: true,
        $component: {
          src: src,
          pick: ["$css"]
        },
        $$route: undefined,
        path,
        filePath: src
      };
    }

    const [_, exports] = analyzeModule(src);
    const hasRouteConfig = exports.find(e => e.n === "route");
    const hasDefault = !!exports.find(e => e.n === "default");
    const hasAPIRoutes = !!exports.find(exp => HTTP_METHODS.includes(exp.n));
    if (hasDefault || hasAPIRoutes) {
      return {
        page: hasDefault,
        $component:
          !this.config.dataOnly && hasDefault
            ? {
                src: src,
                pick: ["default", "$css"]
              }
            : undefined,
        $$route: hasRouteConfig
          ? {
              src: src,
              pick: ["route"]
            }
          : undefined,
        ...createHTTPHandlers(src, exports),
        path,
        filePath: src
      };
    }
  }
}
