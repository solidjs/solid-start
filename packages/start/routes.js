import fg from "fast-glob";
import fs from "fs";
import { init, parse } from "es-module-lexer";
import esbuild from "esbuild";

export async function getRoutes({
  baseDir = "src/pages",
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

  const regex = new RegExp(`(index)?(.(${pageExtensions.join("|")})|.data.js|.data.ts)`);

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
    }

    if (!parentRoute) {
      routesList.push({
        src: src,
        _id: id,
        path: toPath(id) || "/",
        componentSrc: src,
        type: "PAGE"
        // dataSrc: data[full] ? data[full] : exports.includes("data") ? src + "?data" : undefined
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

export function stringifyRoutes(routes) {
  let imports = new Map();
  let vars = 0;

  function addImport(p) {
    let d = "data" + vars++;
    imports.set(p, {
      default: d
    });
    return d;
  }

  function _stringifyRoutes(r) {
    return (
      `[\n` +
      r
        .map(
          i =>
            `{ ${[
              i.dataSrc?.endsWith(".data.js")
                ? `data: ${addImport(process.cwd() + "/" + i.dataSrc)}`
                : undefined,
              `component: lazy(() => import('${process.cwd() + "/" + i.componentSrc}'))`,
              ...Object.keys(i)
                .filter(k => i[k] !== undefined)
                .map(
                  k => `${k}: ${k === "children" ? _stringifyRoutes(i[k]) : JSON.stringify(i[k])}`
                )
            ]
              .filter(Boolean)
              .join(", ")} }`
        )
        .join(",") +
      `\n]`
    );
  }

  let r = _stringifyRoutes(routes.pageRoutes);
  console.log(
    [...imports.keys()].map(i => `import ${imports.get(i).default} from '${i}';`).join("\n")
  );
  const text = `
  import { lazy } from 'solid-js';
  ${[...imports.keys()].map(i => `import ${imports.get(i).default} from '${i}';`).join("\n")}
  const routes = ${r};`;
  return text;
}
