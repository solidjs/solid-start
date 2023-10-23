import { analyzeModule, BaseFileSystemRouter, cleanPath } from "vinxi/fs-router";

export class SolidStartClientFileRouter extends BaseFileSystemRouter {
  toPath(src) {
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

  toRoute(src) {
    let path = this.toPath(src);
    console.log(src);

    if (src.endsWith(".md") || src.endsWith(".mdx")) {
      return {
        type: "page",
        $component: {
          src: src,
          pick: ["$css"]
        },
        $$data: undefined,
        path,
        filePath: src
      };
    }

    const [_, exports] = analyzeModule(src);
    const hasDefault = exports.find(e => e.n === "default");
    const hasRouteData = exports.find(e => e.n === "routeData");
    if (hasDefault) {
      return {
        type: "page",
        $component: {
          src: src,
          pick: ["default", "$css"]
        },
        $$data: hasRouteData
          ? {
              src: src,
              pick: ["routeData"]
            }
          : undefined,
        path,
        filePath: src
      };
    }
  }
}
export class SolidStartServerFileRouter extends BaseFileSystemRouter {
  toPath(src) {
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

  toRoute(src) {
    let path = this.toPath(src);

    if (src.endsWith(".md") || src.endsWith(".mdx")) {
      return {
        type: "page",
        $component: {
          src: src,
          pick: ["$css"]
        },
        $$data: undefined,
        path,
        filePath: src
      };
    }

    const [_, exports] = analyzeModule(src);
    const hasRouteData = exports.find(e => e.n === "routeData");
    if (exports.find(exp => exp.n === "default")) {
      return {
        type: "page",
        $component: {
          src: src,
          pick: ["default", "$css"]
        },
        $$data: hasRouteData
          ? {
              src: src,
              pick: ["routeData"]
            }
          : undefined,
        path,
        filePath: src
      };
    } else if (
      exports.find(
        exp => exp.n === "GET" || exp.n === "POST" || exp.n === "PUT" || exp.n === "DELETE"
      )
    ) {
      return {
        type: "api",
        $GET: exports.find(exp => exp.n === "GET")
          ? {
              src: src,
              pick: ["GET"]
            }
          : undefined,
        $POST: exports.find(exp => exp.n === "POST")
          ? {
              src: src,
              pick: ["POST"]
            }
          : undefined,
        path,
        filePath: src
      };
    }
  }
}
