import fg from "fast-glob";
import fs from "fs";
import { init, parse } from "es-module-lexer";
import esbuild from "esbuild";
import chalk from "chalk";

export async function getRoutes() {
  await init;
  const pageRoutes = fg.sync("src/routes/**/*.(tsx|jsx)", { cwd: process.cwd() });
  const dataRoutes = fg.sync("src/routes/**/*.data.(ts|js)", { cwd: process.cwd() });
  const apiRoutes = fg.sync(["src/routes/**/*.(ts|js)", "!src/routes/**/*.data.(ts|js)"], {
    cwd: process.cwd()
  });

  function toIdentifier(source) {
    // $EXTENSIONS will be replaced by the extensions list
    // by the solid-start vite plugin
    return source
      .slice(`src/routes`.length)
      .replace(/(index)?(.(tsx|jsx|mdx|ts|js)|.data.js|.data.ts)/, "");
  }
  function toPath(id) {
    return id.replace(/\[(.+)\]/, (_, m) => (m.startsWith("...") ? `*${m.slice(3)}` : `:${m}`));
  }

  const data = dataRoutes.reduce((memo, file) => {
    memo[toIdentifier(file)] = file;
    return memo;
  }, {});

  // console.log(data);
  function findNestedPath(list, f, id, full) {
    let temp = list.find(o => o._id && o._id !== "/" && id.startsWith(o._id + "/"));

    let [imports, exports] = parse(
      esbuild.transformSync(fs.readFileSync(process.cwd() + "/" + f).toString(), {
        jsx: "transform",
        format: "esm",
        loader: "tsx"
      }).code
    );
    if (!temp)
      list.push({
        src: f,
        _id: id,
        path: toPath(id) || "/",
        componentSrc: f,
        type: "PAGE",
        dataSrc: data[full] ? data[full] : exports.includes("data") ? f + "?data" : undefined,
        methods: ["GET", ...(exports.includes("action") ? ["POST", "PATCH", "DELETE"] : [])],
        actionSrc: exports.includes("action") ? f + "?action" : undefined,
        loaderSrc: exports.includes("loader") ? f + "?loader" : undefined

        // : function fileData(params) {
        //     const [data] = createResource(async () => {
        //       console.log("data 1", params, importer);
        //       let mod = await importer();
        //       console.log("data 2", mod);
        //       const result = await mod.data?.(params);
        //       console.log("result", result);
        //       return await result;
        //     });
        //     return data;
        //   }
      });
    else findNestedPath(temp.children || (temp.children = []), f, id.slice(temp._id.length), full);
  }

  function findNestedApiPath(list, f, id, full) {
    let temp = list.find(o => o._id && o._id !== "/" && id.startsWith(o._id + "/"));

    let [imports, exports] = parse(
      esbuild.transformSync(fs.readFileSync(process.cwd() + "/" + f).toString(), {
        jsx: "transform",
        format: "esm",
        loader: "tsx"
      }).code
    );
    if ((!temp && exports.includes("action")) || exports.includes("loader"))
      list.push({
        src: f,
        _id: id,
        path: toPath(id) || "/",
        apiSrc: f,
        type: "API ",
        actionSrc: exports.includes("action") ? f + "?action" : undefined,
        loaderSrc: exports.includes("loader") ? f + "?loader" : undefined,
        methods: [
          ...(exports.includes("loader") ? ["GET"] : []),
          ...(exports.includes("action") ? ["POST", "PATCH", "DELETE"] : [])
        ]
      });
  }

  const routes = pageRoutes.reduce((r, file) => {
    let id = toIdentifier(file);
    findNestedPath(r, file, id, id);
    return r;
  }, []);

  const apiRoute = apiRoutes.reduce((r, file) => {
    let id = toIdentifier(file);
    findNestedApiPath(r, file, id, id);
    return r;
  }, []);

  return {
    pageRoutes: routes,
    apiRoutes: apiRoute
  };
}

const { pageRoutes, apiRoutes } = await getRoutes();
let flatRoutes = [];

pageRoutes.forEach(parentRoute => {
  flatRoutes.push(parentRoute);
  if (parentRoute.children) {
    parentRoute.children.forEach(route => {
      flatRoutes.push({
        ...route,
        _id: parentRoute._id + route._id,
        path: parentRoute.path + route.path
      });
    });
  }
});

apiRoutes.forEach(parentRoute => {
  flatRoutes.push(parentRoute);
});

function actualFilePath(path) {
  return `${path}`;
}

flatRoutes.forEach(route => {
  console.log(
    (route.type === "PAGE" ? chalk.yellow : chalk.green)(
      chalk.dim("http://localhost:3000") + route.path
    ),
    chalk.dim(chalk.blue(route.type))
  );
  if (route.componentSrc) {
    console.log(chalk.dim("\tComponent:\t", actualFilePath(route.componentSrc)));
  }
  if (route.dataSrc) {
    console.log(chalk.dim("\tdata:\t\t", actualFilePath(route.dataSrc)));
  }
  if (route.loaderSrc) {
    console.log(chalk.dim("\tloader:\t\t", actualFilePath(route.loaderSrc)));
  }
  if (route.actionSrc) {
    console.log(chalk.dim("\taction:\t\t", actualFilePath(route.actionSrc)));
  }
});
