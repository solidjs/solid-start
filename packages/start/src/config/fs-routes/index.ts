import { relative } from "node:path";
import type { PluginOption, ResolvedConfig } from "vite";
import { manifest } from "./manifest.js";
import type { BaseFileSystemRouter } from "./router.js";
import { treeShake } from "./tree-shake.js";

export const moduleId = "solid-start:routes";

export type RouterBuilder = (config: ResolvedConfig) => BaseFileSystemRouter;

export interface FsRoutesArgs {
  routers: Record<"client" | "server", RouterBuilder>;
  handlers: Record<"client" | "server", string>;
}

export function fsRoutes({
  routers,
  handlers
}: FsRoutesArgs): Array<PluginOption> {
  (globalThis as any).ROUTERS = {};

  return [
    manifest(handlers),
    {
      name: "solid-start-fs-routes",
      enforce: "pre",
      resolveId(id) {
        if (id === moduleId) return id;
      },
      async load(id) {
        const root = this.environment.config.root;
        const isBuild = this.environment.mode === "build";

        if (id !== moduleId) return;
        const js = jsCode();

        const router = routers[this.environment.name as keyof typeof routers](
          this.environment.config
        );

        (globalThis as any).ROUTERS[this.environment.name] = router;

        const routes = await router.getRoutes();

        let routesCode = JSON.stringify(routes ?? [], (k, v) => {
          if (v === undefined) return undefined;

          if (k.startsWith("$$")) {
            const buildId = `${v.src}?${v.pick.map((p: any) => `pick=${p}`).join("&")}`;

            /**
             * @type {{ [key: string]: string }}
             */
            const refs: Record<string, string> = {};
            for (var pick of v.pick) {
              refs[pick] = js.addNamedImport(pick, buildId);
            }
            return {
              require: `_$() => ({ ${Object.entries(refs)
                .map(([pick, namedImport]) => `'${pick}': ${namedImport}`)
                .join(", ")} })$_`
              // src: isBuild ? relative(root, buildId) : buildId
            };
          } else if (k.startsWith("$")) {
            const buildId = `${v.src}?${v.pick.map((p: any) => `pick=${p}`).join("&")}`;
            return {
              src: relative(root, buildId),
              build: isBuild ? `_$() => import(/* @vite-ignore */ '${buildId}')$_` : undefined,
              import:
                this.environment.name === "server"
                  ? `_$() => import(/* @vite-ignore */ '${buildId}')$_`
                  : `_$(() => clientManifestImport('${relative(root, buildId)}'))$_`
            };
          }
          return v;
        });

        routesCode = routesCode.replaceAll('"_$(', "(").replaceAll(')$_"', ")");

        const code = `
${js.getImportStatements()}
${this.environment.name === "server"
            ? ""
            : `
function clientManifestImport(id) {
  return import(/* @vite-ignore */ globalThis.MANIFEST.inputs[id].output.path)
}`
          }
export default ${routesCode}`;
        return code;
      }
    },
    treeShake()
  ];
}

function jsCode() {
  let imports = new Map();
  let vars = 0;

  function addImport(p: any) {
    let id = imports.get(p);
    if (!id) {
      id = {};
      imports.set(p, id);
    }

    let d = "routeData" + vars++;
    id["default"] = d;
    return d;
  }

  function addNamedImport(name: string | number, p: any) {
    let id = imports.get(p);
    if (!id) {
      id = {};
      imports.set(p, id);
    }

    let d = "routeData" + vars++;
    id[name] = d;
    return d;
  }

  const getNamedExport = (p: any) => {
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
          `import ${imports.get(i).default
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
