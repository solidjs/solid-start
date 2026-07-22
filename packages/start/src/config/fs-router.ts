import {
  analyzeModule,
  getExportName,
  getLocalExportName,
  PageFileSystemRouter,
  type FileSystemRouterConfig,
  type ModuleRef,
  type RouteManifestEntry,
} from "@solidjs/file-routes";

/**
 * The client router is the plain page convention from `@solidjs/file-routes`:
 * default export = page, optional `route` config export, md/mdx pages.
 */
export { PageFileSystemRouter as SolidStartClientFileRouter };

const HTTP_METHODS = ["HEAD", "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];

function createHTTPHandlers(src: string, exports: readonly string[]) {
  const handlers: Record<string, ModuleRef> = {};
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

/**
 * SolidStart's server convention on top of the shared page convention:
 * modules may additionally export `GET`, `POST`, etc. API handlers, and
 * component refs are omitted entirely when SSR is disabled (`dataOnly`).
 */
export class SolidStartServerFileRouter extends PageFileSystemRouter {
  declare config: FileSystemRouterConfig & { dataOnly?: boolean };

  constructor(config: FileSystemRouterConfig & { dataOnly?: boolean }) {
    super(config);
  }

  toRoute(src: string): RouteManifestEntry | undefined {
    if (this.config.toRoute) return this.config.toRoute(src, this);

    const path = this.toPath(src);
    if (path === undefined) return;

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
