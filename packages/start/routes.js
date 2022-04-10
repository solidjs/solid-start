import fg from "fast-glob";
import fs from "fs";
import path, { join } from "path";
import { init, parse } from "es-module-lexer";
import esbuild from "esbuild";
import chokidar from "chokidar";
import debug from "debug";

const log = debug("solid-start");
const ROUTE_KEYS = ["component", "path", "data", "children"];
const API_METHODS = ["get", "post", "put", "delete", "patch"];
function toPath(id) {
  return id.replace(/\[(.+)\]/, (_, m) => (m.startsWith("...") ? `*${m.slice(3)}` : `:${m}`));
}

export class Router {
  routes;
  baseDir;
  pageExtensions;
  cwd;
  watcher;
  constructor({
    baseDir = "src/routes",
    pageExtensions = ["jsx", "tsx", "js", "ts"],
    cwd = process.cwd()
  }) {
    this.baseDir = baseDir;
    this.pageExtensions = pageExtensions;
    this.cwd = cwd;
    this.routes = {};
  }

  async init() {
    await init;

    if (this.watcher) {
      this.watcher.close();
    }

    const routes = fg.sync([`${this.baseDir}/**/*`], {
      cwd: this.cwd
    });

    routes.forEach(route => {
      this.processFile(route);
    });
  }

  watch(onChange) {
    if (this.watcher) {
      return;
    }
    this.watcher = chokidar.watch("src/routes/**/*", { cwd: this.cwd, ignoreInitial: true });

    this.watcher.on("all", (event, path) => {
      switch (event) {
        case "add": {
          this.processFile(path);
          this.rawFiles[path] = true;
          break;
        }
        case "change":
          this.processFile(path);
          break;
        case "unlink":
          this.routes = Object.fromEntries(
            Object.entries(this.routes).filter(
              ([k, v]) => v.componentPath !== path && v.dataPath !== path
            )
          );
          this.notify(path);
          delete this.rawFiles[path];
          break;
      }
    });
  }

  rawFiles = {};

  listener;

  notify(path) {
    this.listener && this.listener(path);
  }

  notifyFsEvent() {}

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

  processFile(path) {
    // if its a route data function
    if (path.match(new RegExp(`\\.data\\.(${["ts", "js"].join("|")})`))) {
      let id = path
        .slice(this.baseDir.length)
        .replace(new RegExp(`(index)?\\.data\\.(${["ts", "js"].join("|")})`), "");
      this.setRouteData(id, path);
      return;
    }

    // if its a possible page due to its extension
    if (path.match(new RegExp(`\\.(${this.pageExtensions.join("|")})`))) {
      log("processing", path);
      let id = path
        .slice(this.baseDir.length)
        .replace(new RegExp(`(index)?\\.(${this.pageExtensions.join("|")})`), "");

      let routeConfig = {};

      if (path.match(new RegExp(`\\.(${["ts", "tsx", "jsx", "js"].join("|")})`))) {
        try {
          let [imports, exports] = parse(
            esbuild.transformSync(fs.readFileSync(join(this.cwd, path)).toString(), {
              jsx: "transform",
              format: "esm",
              loader: "tsx"
            }).code
          );

          if (exports.includes("default")) {
            routeConfig.componentPath = path;
          }

          for (var method of API_METHODS) {
            if (exports.includes(method)) {
              if (!routeConfig.apiPath) {
                routeConfig.apiPath = {};
              }

              routeConfig.apiPath[method] = path;
              // this.setAPIRoute(id, method, path);
            }
          }

          if (exports.includes("routeData")) {
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
        let { id: oldID, path: oldPath, dataPath, ...oldConfig } = this.routes[id];
        let newConfig = { ...routeConfig };

        if (dataPath && !dataPath.endsWith("?data") && !newConfig.dataPath) {
          newConfig.dataPath = dataPath;
        }

        if (JSON.stringify({ dataPath, ...oldConfig }) !== JSON.stringify(newConfig)) {
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
    function processRoute(routes, route, id, full) {
      const parentRoute = Object.values(routes).find(
        o => o.id && o.id !== "/" && id.startsWith(o.id + "/")
      );

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

    const routes = Object.values(this.routes).reduce((r, route) => {
      if (route.componentPath) {
        processRoute(r, route, route.id, route.id);
      }
      return r;
    }, []);

    return routes;
  }

  getFlattenedApiRoutes() {
    const routes = Object.values(this.routes).reduce((r, route) => {
      if (route.apiPath) {
        r.push({ ...route, id: route.id, path: toPath(route.id) });
      }
      return r;
    }, []);

    return routes;
  }

  getFlattenedPageRoutes() {
    const routes = Object.values(this.routes).reduce((r, route) => {
      if (route.componentPath) {
        r.push({ ...route, id: route.id, path: toPath(route.id) });
      }
      return r;
    }, []);

    return routes;
  }
}

export function stringifyPageRoutes(pageRoutes, options = {}) {
  const jsFile = jsCode();

  function _stringifyRoutes(r) {
    return (
      `[\n` +
      r
        .filter(i => i.componentPath || i.children)
        .map(
          i =>
            `{\n${[
              /.data.(js|ts)$/.test(i.dataPath ?? "")
                ? `data: ${jsFile.addImport(path.posix.resolve(i.dataPath))}`
                : i.dataPath
                ? `data: ${jsFile.addNamedImport("routeData", path.posix.resolve(i.dataPath))}`
                : "",
              `component: ${
                options.lazy
                  ? `lazy(() => import('${path.posix.resolve(i.componentPath)}'))`
                  : jsFile.addImport(path.posix.resolve(i.componentPath))
              }`,
              ...Object.keys(i)
                .filter(k => ROUTE_KEYS.indexOf(k) > -1 && i[k] !== undefined)
                .map(
                  k => `${k}: ${k === "children" ? _stringifyRoutes(i[k]) : JSON.stringify(i[k])}`
                )
            ]
              .filter(Boolean)
              .join(",\n ")} \n}`
        )
        .join(",\n") +
      `\n]`
    );
  }

  let routeConfig = _stringifyRoutes(pageRoutes);

  const text = `
  ${options.lazy ? `import { lazy } from 'solid-js';` : ""}
  ${jsFile.getImportStatements()}
  const routes = ${routeConfig};`;

  return text;
}

export function stringifyApiRoutes(flatRoutes, options = {}) {
  const jsFile = jsCode();

  function _stringifyRoutes(r) {
    return (
      `[\n` +
      r
        .map(
          i =>
            `{\n${[
              ...API_METHODS.filter(j => i.apiPath[j]).map(
                v =>
                  `${v}: ${
                    // options.lazy
                    // ? `lazy(() => import('${path.posix.resolve(i.componentSrc)}'))`
                    jsFile.addNamedImport(v, path.posix.resolve(i.apiPath[v]))
                  }`
              ),

              ...Object.keys(i)
                .filter(k => ROUTE_KEYS.indexOf(k) > -1 && i[k] !== undefined)
                .map(
                  k => `${k}: ${k === "children" ? _stringifyRoutes(i[k]) : JSON.stringify(i[k])}`
                )
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
  let imports = new Map();
  let vars = 0;

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

  const getNamedExport = p => {
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
