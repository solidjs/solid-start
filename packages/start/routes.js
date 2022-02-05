import fg from "fast-glob";
import fs from "fs";
import path from "path";
import { init, parse } from "es-module-lexer";
import esbuild from "esbuild";

const ROUTE_KEYS = ["component", "path", "data", "children"];

export async function getRoutes({
  baseDir = "src/routes",
  pageExtensions = ["jsx", "tsx", "js", "ts"],
  cwd = process.cwd()
} = {}) {
  await init;
  const pageRoutes = fg.sync(
    [`${baseDir}/**/*.(${pageExtensions.join("|")})`, `!${baseDir}/**/*.data.(ts|js)`],
    {
      cwd
    }
  );

  const dataRoutes = fg.sync(`${baseDir}/**/*.data.(ts|js)`, { cwd });

  const regex = new RegExp(`(index)?(\\.(${pageExtensions.join("|")})|\\.data\\.js|\\.data\\.ts)`);

  function toIdentifier(source) {
    return source.slice(baseDir.length).replace(regex, "");
  }

  function toPath(id) {
    return id.replace(/\[(.+)\]/, (_, m) => (m.startsWith("...") ? `*${m.slice(3)}` : `:${m}`));
  }

  const data = dataRoutes.reduce((memo, file) => {
    memo[toIdentifier(file)] = file;
    return memo;
  }, {});

  // processRoute populates the routesList with the given route.
  // if checks if a parent route exists and if it does, it adds the route to the parent's children.
  // it also checks that if a file is a javascript/typescript file, it must have a default export to be
  // considered a route
  function processRoute(routesList, src, id, full) {
    let parentRoute = routesList.find(o => o._id && o._id !== "/" && id.startsWith(o._id + "/"));

    let dataFn = undefined;
    if (/\.(js|ts)x?$/.test(src)) {
      let [imports, exports] = parse(
        esbuild.transformSync(fs.readFileSync(process.cwd() + "/" + src).toString(), {
          jsx: "transform",
          format: "esm",
          loader: "tsx"
        }).code
      );
      if (!exports.includes("default")) {
        return;
      }

      if (exports.includes("routeData")) {
        dataFn = src + "?data";
        // dataFn = src.replace("tsx", "data.ts");
      }
    }

    if (!parentRoute) {
      routesList.push({
        src: src,
        _id: id,
        path: toPath(id) || "/",
        componentSrc: src,
        type: "PAGE",
        dataSrc: data[full] ? data[full] : dataFn
        // methods: ["GET", ...(exports.includes("action") ? ["POST", "PATCH", "DELETE"] : [])]
        // actionSrc: exports.includes("action") ? src + "?action" : undefined,
        // loaderSrc: exports.includes("loader") ? src + "?loader" : undefined
      });
    } else {
      processRoute(
        parentRoute.children || (parentRoute.children = []),
        src,
        id.slice(parentRoute._id.length),
        full
      );
    }
  }

  const routes = pageRoutes.reduce((r, file) => {
    let id = toIdentifier(file);
    processRoute(r, file, id, id);
    return r;
  }, []);

  return {
    pageRoutes: routes
  };
}

export function stringifyRoutes(routes, options = {}) {
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

  function _stringifyRoutes(r) {
    return (
      `[\n` +
      r
        .map(
          i =>
            `{\n${[
              /.data.(js|ts)$/.test(i.dataSrc ?? "")
                ? `data: ${addImport(path.posix.resolve(i.dataSrc))}`
                : i.dataSrc
                ? `data: ${addNamedImport("routeData", path.posix.resolve(i.dataSrc))}`
                : "",
              `component: ${
                options.lazy
                  ? `lazy(() => import('${path.posix.resolve(i.componentSrc)}'))`
                  : addImport(path.posix.resolve(i.componentSrc))
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

  let r = _stringifyRoutes(routes.pageRoutes);

  const getNamedExport = p => {
    let id = imports.get(p);

    delete id["default"];

    return Object.keys(id).length > 0
      ? `{ ${Object.keys(id)
          .map(k => `${k} as ${id[k]}`)
          .join(", ")} }`
      : "";
  };

  const text = `
  ${options.lazy ? `import { lazy } from 'solid-js';` : ""}
  ${[...imports.keys()]
    .map(
      i =>
        `import ${
          imports.get(i).default
            ? `${imports.get(i).default}${Object.keys(imports.get(i)).length > 1 ? ", " : ""}`
            : ""
        } ${getNamedExport(i)} from '${i}';`
    )
    .join("\n")}
  const routes = ${r};`;
  return text;
}
