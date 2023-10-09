import chokidar from "chokidar";
import debug from "debug";
import { dequal } from "dequal";
import { init, parse } from "es-module-lexer";
import esbuild from "esbuild";
import fg from "fast-glob";
import fs from "fs";
import path, { join } from "path";
import { toPath } from "./path-utils.js";

const log = debug("solid-start");

// Available HTTP methods / verbs for api routes
// `delete` is a reserved word in JS, so we use `del` instead
const API_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

/**
 * @typedef {{id: string; path: string; dataPath?: string;componentPath?: string; children?: RouteConfig[]; apiPath?: {[key: string]: string;};}} RouteConfig
 */

export class Router {
  /** @type {{ [key: string]: RouteConfig }} */
  routes;
  baseDir;

  include;

  /** @type {string} */
  cwd;

  /** @type {import('chokidar').FSWatcher | undefined} */
  watcher;
  pageDataRegex;

  constructor({
    baseDir = "src/routes",
    include = new RegExp(`\\.(${["jsx", "tsx", "js", "ts"].join("|")})$`),
    cwd = process.cwd()
  }) {
    this.baseDir = baseDir;
    this.cwd = cwd;
    this.routes = {};
    // this.exclude = exclude;
    this.include = include;
    this.pageDataRegex = new RegExp(`\\.data\\.(${["ts", "js"].join("|")})$`);
  }

  async init() {
    await init;

    if (this.watcher) {
      this.watcher.close();
    }

    const routes = fg.sync([`${this.baseDir}/**/*`], {
      cwd: this.cwd,
      dot: true
    });

    routes.forEach(route => {
      this.processFile(route);
    });
  }

  watch() {
    if (this.watcher) {
      return;
    }

    this.watcher = chokidar.watch(`${this.baseDir}/**/*`, { cwd: this.cwd, ignoreInitial: true });

    this.watcher.on("all", (event, filePath) => {
      const posixPath = filePath.split(path.sep).join(path.posix.sep);
      switch (event) {
        case "add": {
          this.processFile(posixPath);
          this.rawFiles[posixPath] = true;
          break;
        }
        case "change":
          this.processFile(posixPath);
          break;
        case "unlink":
          this.routes = Object.fromEntries(
            Object.entries(this.routes).filter(
              ([k, v]) => v.componentPath !== posixPath && v.dataPath !== posixPath
            )
          );
          this.notify(posixPath);
          delete this.rawFiles[posixPath];
          break;
      }
    });
  }

  /** @type {{ [key: string]: boolean }} */
  rawFiles = {};

  /** @type {((path: string) => void) | undefined} */
  listener;

  /** @param {string} path */
  notify(path) {
    this.listener && this.listener(path);
  }

  /**
   * @param {string} route
   * @param {string} data
   * */
  setRouteData(route, data) {
    if (!this.routes[route]) {
      this.routes[route] = { id: route, path: toPath(route) || "/", dataPath: data };
      this.notify(data);
      return;
    }

    if (!this.routes[route].dataPath) {
      this.routes[route].dataPath = data;
      this.notify(data);
      return;
    }
  }

  /** @param {string} path */
  isRoute(path) {
    return path.match(this.include);
  }

  /**
   *
   * @param {string} path
   * @returns
   */
  processFile(path) {
    // if its a route data function
    if (path.match(this.pageDataRegex)) {
      let id = this.getRouteId(path.replace(this.pageDataRegex, ""));
      this.setRouteData(id, path);
      return;
    }

    // if its a possible page due to its extension
    if (this.isRoute(path)) {
      log("processing", path);
      let routeConfig = this.createRouteConfig(path);

      // renamed index should have a trailing slash like index files
      if (!routeConfig.path.endsWith("/") && /\/\([^)/]+\)$/.test(routeConfig.id)) {
        routeConfig.path += "/";
      }

      if (this.routes[routeConfig.id]) {
        // get old config, we want to compare the oldConfig with the new one to
        // detect changes and restart the vite server
        let oldConfig = this.routes[routeConfig.id];
        let newConfig = { ...routeConfig };

        if (oldConfig.dataPath && !oldConfig.dataPath.endsWith("?data") && !newConfig.dataPath) {
          newConfig.dataPath = oldConfig.dataPath;
        }

        if (!dequal(oldConfig, newConfig)) {
          this.routes[routeConfig.id] = { ...newConfig };
          this.notify(path);
        }
      } else {
        this.routes[routeConfig.id] = routeConfig;
        this.notify(path);
      }
    }
  }

  /** @param {string} path */
  createRouteConfig(path) {
    let id = this.getRouteId(path.replace(this.include, ""));

    /** @type {RouteConfig} */
    let routeConfig = {
      id,
      path: toPath(id) ?? "/"
    };

    if (path.match(new RegExp(`\\.(${["ts", "tsx", "jsx", "js"].join("|")})$`))) {
      let code = fs.readFileSync(join(this.cwd, path)).toString();
      try {
        let [, exports] = parse(
          esbuild.transformSync(code, {
            jsx: "transform",
            format: "esm",
            loader: "tsx"
          }).code
        );

        if (exports.find($ => $.n === "default")) {
          routeConfig.componentPath = path;
        }

        for (var method of API_METHODS) {
          if (exports.find($ => $.n === method)) {
            if (!routeConfig.apiPath) {
              routeConfig.apiPath = {};
            }

            routeConfig.apiPath[method] = path;
            // this.setAPIRoute(id, method, path);
          }
        }

        if (exports.find($ => $.n === "routeData")) {
          routeConfig.dataPath = path + "?data";
          // this.setRouteData(id, path + "?data");
          // dataFn = src.replace("tsx", "data.ts");
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      routeConfig.componentPath = path;
    }
    return routeConfig;
  }

  /** @param {string} path */
  getRouteId(path) {
    return path.slice(this.baseDir.length);
  }

  getNestedPageRoutes() {
    if (this._nestedPageRoutes) {
      return this._nestedPageRoutes;
    }

    /**
     * @param {RouteConfig[]} routes
     * @param {RouteConfig} route
     * @param {string} partialId
     * @param {string} fullId
     */
    function processRoute(routes, route, partialId, fullId) {
      const parentRoute = Object.values(routes).find(o => {
        if (o.id.endsWith("/index")) {
          return false;
        }
        return partialId.startsWith(o.id + "/");
      });

      if (parentRoute) {
        processRoute(
          parentRoute.children || (parentRoute.children = []),
          route,
          partialId.slice(parentRoute.id.length),
          fullId
        );
      } else {
        routes.push({ ...route, id: partialId, path: toPath(partialId) });
      }
    }

    /** @type {RouteConfig[]} */
    const nestedRoutes = Object.values(this.routes)
      .sort((a, b) => a.id.localeCompare(b.id))
      .reduce((r, route) => {
        if (route.componentPath) {
          processRoute(r, route, route.id, route.id);
        }
        return r;
      }, []);

    this._nestedPageRoutes = nestedRoutes;

    return nestedRoutes;
  }

  isLayoutRoute(/** @type {RouteConfig} */ route) {
    if (route.id.endsWith("/index")) {
      return false;
    }

    return Object.values(this.routes).some(r => {
      return r.id.startsWith(route.id + "/") && r.componentPath;
    });
  }

  getRouteLayouts() {
    const routes = this.getNestedPageRoutes();
    return routes.reduce(
      (/** @type {{ [key: string]: { id: string; layouts: string[] }}} */ routeMap, route) => {
        function buildRouteLayoutsMap(
          /** @type {RouteConfig} */ route,
          /** @type {string} */ path,
          /** @type {string[]} */ layouts
        ) {
          const fullPath = path + route.path;
          const fullId = toPath(
            layouts.length ? layouts[layouts.length - 1] + route.id : route.id,
            false
          );

          if (!route.children) {
            routeMap[fullPath] = { id: fullId, layouts };
            return;
          }

          const parentLayouts = [...layouts, fullId];

          route.children.forEach(child => buildRouteLayoutsMap(child, fullPath, parentLayouts));
        }

        buildRouteLayoutsMap(route, "", []);

        return routeMap;
      },
      {}
    );
  }

  getFlattenedApiRoutes(includePageRoutes = false) {
    return Object.values(this.routes).filter(
      route =>
        route.apiPath || (includePageRoutes && route.componentPath && !this.isLayoutRoute(route))
    );
  }

  getFlattenedPageRoutes(includeLayouts = false) {
    return Object.values(this.routes).filter(
      route => route.componentPath && (!this.isLayoutRoute(route) || includeLayouts)
    );
  }
}

export function stringifyPageRoutes(
  /** @type {RouteConfig[]} */ routes,
  /** @type {{ lazy?: boolean }} */ options = {}
) {
  const jsFile = jsCode();

  /** @return {string} */
  function _stringifyRoutes(/** @type {RouteConfig[]} */ routes) {
    return (
      `[\n` +
      routes
        .filter(i => i.componentPath || i.children)
        .map(
          i =>
            `{\n${[
              i.dataPath && /.data.(js|ts)$/.test(i.dataPath)
                ? `data: ${jsFile.addImport(path.posix.resolve(i.dataPath))}`
                : i.dataPath
                ? `data: ${jsFile.addNamedImport("routeData", path.posix.resolve(i.dataPath))}`
                : "",
              i.componentPath &&
                `component: ${
                  options.lazy
                    ? `lazy(() => import('${path.posix.resolve(i.componentPath)}'))`
                    : jsFile.addImport(path.posix.resolve(i.componentPath))
                }`,
              i.children && `children: ${_stringifyRoutes(i.children)}`,
              `path: ${JSON.stringify(i.path)}`
            ]
              .filter(Boolean)
              .join(",\n ")} \n}`
        )
        .join(",\n") +
      `\n]`
    );
  }

  const stringifiedRoutes = _stringifyRoutes(routes);

  const text = `
  ${options.lazy ? `import { lazy } from 'solid-js';` : ""}
  ${jsFile.getImportStatements()}
  const fileRoutes = /*#__PURE__*/ ${stringifiedRoutes};`;

  return text;
}

export function stringifyAPIRoutes(
  /** @type {(RouteConfig)[]} */ flatRoutes,
  /** @type {{ lazy?: boolean }} */ options = {}
) {
  const jsFile = jsCode();

  /**
   * @return {string}
   */
  function _stringifyRoutes(/** @type {(RouteConfig)[]} */ routes) {
    return (
      `[\n` +
      routes
        .map(
          i =>
            `{\n${[
              ...API_METHODS.filter(j => i.apiPath?.[j]).map(
                v =>
                  i.apiPath != null &&
                  `${v}: ${jsFile.addNamedImport(v, path.posix.resolve(i.apiPath[v]))}`
              ),
              i.componentPath ? `GET: "skip"` : undefined,
              `path: ${JSON.stringify(i.path)}`
            ]
              .filter(Boolean)
              .join(",\n ")} \n}`
        )
        .join(",\n") +
      `\n]`
    );
  }

  let routeConfig = _stringifyRoutes(flatRoutes);

  const text = `
  ${jsFile.getImportStatements()}
  const api = /*#__PURE__*/ ${routeConfig};`;

  return text;
}

function jsCode() {
  let imports = new Map();
  let vars = 0;

  function addImport(/** @type {string} */ p) {
    let id = imports.get(p);
    if (!id) {
      id = {};
      imports.set(p, id);
    }

    let d = "routeData" + vars++;
    id["default"] = d;
    return d;
  }

  function addNamedImport(/** @type {string} */ name, /** @type {string} */ p) {
    let id = imports.get(p);
    if (!id) {
      id = {};
      imports.set(p, id);
    }

    let d = "routeData" + vars++;
    id[name] = d;
    return d;
  }

  const getNamedExport = (/** @type {string} */ p) => {
    let id = imports.get(p);

    delete id["default"];

    return Object.keys(id).length > 0
      ? `{ ${Object.keys(id)
          .map(k => `${k} as ${id[k]}`)
          .join(", ")} }`
      : "";
  };

  const getImportStatements = () => {
    return `${[...imports.keys()]
      .map(
        i =>
          `import ${
            imports.get(i).default
              ? `${imports.get(i).default}${Object.keys(imports.get(i)).length > 1 ? ", " : ""}`
              : ""
          } ${getNamedExport(i)} from '${i}';`
      )
      .join("\n")}`;
  };

  return {
    addImport,
    addNamedImport,
    getImportStatements
  };
}
