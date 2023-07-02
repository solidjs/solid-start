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
const ROUTE_KEYS = ["component", "path", "data"];

// Available HTTP methods / verbs for api routes
// `delete` is a reserved word in JS, so we use `del` instead
const API_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

/** @typedef {{ id: string, path: string, componentPath?: string, dataPath?: string, apiPath?: { [method: string]: string }, children?: Route[] }} Route */

export class Router {
  /** @type {{ [filePath: string]: Route }} */
  routes;
  baseDir;
  pageExtensions;
  cwd;
  /** @type {chokidar.FSWatcher | undefined} */
  watcher;
  ignore;
  /** @type {{ [filePath: string]: boolean }} */
  rawFiles = {};
  /** @type {((path: string) => void) | undefined} */
  listener;
  /**
   * @param {{ baseDir?: string, pageExtensions?: string[], cwd?: string, ignore?: string[] }} options
   */
  constructor({
    baseDir = "src/routes",
    pageExtensions = ["jsx", "tsx", "js", "ts"],
    cwd = process.cwd(),
    ignore = []
  }) {
    this.baseDir = baseDir;
    this.pageExtensions = pageExtensions;
    this.cwd = cwd;
    this.routes = {};
    this.ignore = ignore;
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

  /**
   * @param {string} path
   */
  notify(path) {
    this.listener && this.listener(path);
  }

  /**
   * @param {string} route
   * @param {string} data
   */
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

  /**
   * @param {string} path
   */
  processFile(path) {
    // if its a route data function
    const pageDataRegex = new RegExp(`\\.data\\.(${["ts", "js"].join("|")})$`);
    if (path.match(pageDataRegex)) {
      let id = path.slice(this.baseDir.length).replace(pageDataRegex, "");
      this.setRouteData(id, path);
      return;
    }

    // if its a possible page due to its extension
    const pageRegex = new RegExp(`\\.(${this.pageExtensions.join("|")})$`);
    if (path.match(pageRegex)) {
      log("processing", path);
      let id = path.slice(this.baseDir.length).replace(pageRegex, "");

      /** @type {{ dataPath?: string; componentPath?: string; apiPath?: { [key: string]: string  }}} */
      let routeConfig = {};

      if (path.match(new RegExp(`\\.(${["ts", "tsx", "jsx", "js"].join("|")})$`))) {
        let code = fs.readFileSync(join(this.cwd, path)).toString();
        try {
          let [_imports, exports] = parse(
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
        // this.setRouteComponent(id, path);
        // this.setRouteComponent(id, path);
      }

      if (this.routes[id]) {
        // get old config, we want to compare the oldConfig with the new one to
        // detect changes and restart the vite server
        let { id: oldID, path: oldPath, ...oldConfig } = this.routes[id];
        let newConfig = { ...routeConfig };

        if (oldConfig.dataPath && !oldConfig.dataPath.endsWith("?data") && !newConfig.dataPath) {
          newConfig.dataPath = oldConfig.dataPath;
        }

        if (!dequal(oldConfig, newConfig)) {
          this.routes[id] = { id, path: toPath(id) ?? "/", ...newConfig };
          this.notify(path);
        }
      } else {
        this.routes[id] = { id, path: toPath(id) ?? "/", ...routeConfig };
        this.notify(path);
      }
    }
  }

  getNestedPageRoutes() {
    if (this._nestedPageRoutes) {
      return this._nestedPageRoutes;
    }

    /**
     * @param {Route[]} routes
     * @param {Route} route
     * @param {string} id
     * @param {string} full
     */
    function processRoute(routes, route, id, full) {
      const parentRoute = Object.values(routes).find(o => {
        if (o.id.endsWith("/index")) {
          return false;
        }
        return id.startsWith(o.id + "/");
      });

      if (!parentRoute) {
        routes.push({ ...route, id, path: toPath(id) });
        return;
      }
      processRoute(
        parentRoute.children || (parentRoute.children = []),
        route,
        id.slice(parentRoute.id.length),
        full
      );
    }

    const routes = Object.values(this.routes).reduce((/** @type {Route[]} */ r, route) => {
      if (route.componentPath) {
        processRoute(r, route, route.id, route.id);
      }
      return r;
    }, []);

    this._nestedPageRoutes = routes;

    return routes;
  }

  /**
   * @param {Route} route
   */
  isLayoutRoute(route) {
    if (route.id.endsWith("/index")) {
      return false;
    }
    return Object.values(this.routes).some(r => {
      return r.id.startsWith(route.id + "/") && r.componentPath;
    });
  }

  getRouteLayouts() {
    const routes = this.getNestedPageRoutes();
    /** @typedef {{ [route: string]: { id: string, layouts: string[] } }} RouteLayoutsMap */
    return routes.reduce((/** @type {RouteLayoutsMap} */ routeMap, route) => {
      /**
       * @param {Route} route
       * @param {string} path
       * @param {string[]} layouts
       */
      function buildRouteLayoutsMap(route, path, layouts) {
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
    }, {});
  }

  getFlattenedApiRoutes(includePageRoutes = false) {
    const routes = Object.values(this.routes).reduce((/** @type {Route[]} */ r, route) => {
      if (
        route.apiPath ||
        (includePageRoutes && route.componentPath && !this.isLayoutRoute(route))
      ) {
        const path = toPath(route.id);
        r.push({ ...route, id: route.id, path });
      }
      return r;
    }, []);

    return routes;
  }

  getFlattenedPageRoutes(includeLayouts = false) {
    const routes = Object.values(this.routes).reduce((/** @type {Route[]} */ r, route) => {
      if (route.componentPath && (!this.isLayoutRoute(route) || includeLayouts)) {
        const path = toPath(route.id);
        r.push({ ...route, id: route.id, path });
      }
      return r;
    }, []);

    return routes;
  }
}

/**
 * @param {Route[]} routes
 * @param {{ lazy?: boolean }} options
 */
export function stringifyPageRoutes(routes, options = {}) {
  const jsFile = jsCode();

  /**
   * @param {Route[]} r
   * @returns {string}
   */
  function _stringifyRoutes(r) {
    return (
      `[\n` +
      r
        .filter(i => i.componentPath || i.children)
        .map(
          i =>
            `{\n${[
              i.dataPath && /.data.(js|ts)$/.test(i.dataPath)
                ? `data: ${jsFile.addImport(path.posix.resolve(i.dataPath))}`
                : i.dataPath
                ? `data: ${jsFile.addNamedImport("routeData", path.posix.resolve(i.dataPath))}`
                : "",
              i.componentPath
                ? `component: ${
                    options.lazy
                      ? `lazy(() => import('${path.posix.resolve(i.componentPath)}'))`
                      : jsFile.addImport(path.posix.resolve(i.componentPath))
                  }`
                : "",
              ...(i.children ? [_stringifyRoutes(i.children)] : []),
              ...Object.entries(i)
                .filter(([k, v]) => ROUTE_KEYS.includes(k) && v !== undefined)
                .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
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

/**
 * @param {Route[]} flatRoutes
 */
export function stringifyApiRoutes(flatRoutes) {
  const jsFile = jsCode();

  /**
   * @param {Route[]} r
   * @returns {string}
   */
  function _stringifyRoutes(r) {
    return (
      `[\n` +
      r
        .map(
          i =>
            `{\n${[
              ...(i.apiPath
                ? Object.entries(i.apiPath).map(
                    ([k, v]) => `${v}: ${jsFile.addNamedImport(v, path.posix.resolve(v))}`
                  )
                : []),
              i.componentPath ? `GET: "skip"` : undefined,
              ...(i.children ? [_stringifyRoutes(i.children)] : []),
              ...Object.entries(i)
                .filter(([k, v]) => ROUTE_KEYS.includes(k) && v !== undefined)
                .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
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
  const api = ${routeConfig};`;

  return text;
}

function jsCode() {
  /** @type {Map<string, { [name: string]: string }>} */
  let imports = new Map();
  let vars = 0;

  /**
   * @param {string} p
   */
  function addImport(p) {
    let id = imports.get(p);
    if (!id) {
      id = {};
      imports.set(p, id);
    }

    let d = "routeData" + vars++;
    id["default"] = d;
    return d;
  }

  /**
   * @param {string} name
   * @param {string} p
   */
  function addNamedImport(name, p) {
    let id = imports.get(p);
    if (!id) {
      id = {};
      imports.set(p, id);
    }

    let d = "routeData" + vars++;
    id[name] = d;
    return d;
  }

  /**
   * @param {string} p
   */
  const getNamedExport = p => {
    let id = imports.get(p) ?? {};

    delete id["default"];

    return Object.keys(id).length > 0
      ? `{ ${Object.keys(id)
          .map(k => `${k} as ${id[k]}`)
          .join(", ")} }`
      : "";
  };

  const getImportStatements = () => {
    return `${[...imports.entries()]
      .map(
        ([i, v]) =>
          `import ${
            v.default ? `${v.default}${Object.keys(v).length > 1 ? ", " : ""}` : ""
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
