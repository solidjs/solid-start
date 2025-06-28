import { PluginOption, ResolvedConfig } from "vite";
import { relative } from "node:path";

import { BaseFileSystemRouter } from "./router.js";
import { manifest } from "./manifest.js";

export const moduleId = "solid-start:routes";

export type RouterBuilder = (config: ResolvedConfig) => BaseFileSystemRouter;

export function fsRoutes({
  routers,
  handlers
}: {
  routers: Record<"client" | "server", RouterBuilder>;
  handlers: Record<"client" | "server", string>;
}): Array<PluginOption> {
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
          if (v === undefined) {
            return undefined;
          }

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
                .join(", ")} })$_`,
              src: isBuild ? relative(root, buildId) : buildId
            };
          } else if (k.startsWith("$")) {
            const buildId = `${v.src}?${v.pick.map((p: any) => `pick=${p}`).join("&")}`;
            return {
              src: isBuild ? relative(root, buildId) : buildId,
              build: isBuild ? `_$() => import(/* @vite-ignore */ '${buildId}')$_` : undefined,
              import:
                this.environment.name === "server"
                  ? `_$() => import(/* @vite-ignore */ '${buildId}')$_`
                  : `_$(() => { const id = '${relative(
                      root,
                      buildId
                    )}'; return import(/* @vite-ignore */ globalThis.MANIFEST['${
                      this.environment.name
                    }'].inputs[id].output.path) })$_`
            };
          }
          return v;
        });

        routesCode = routesCode.replaceAll('"_$(', "(").replaceAll(')$_"', ")");

        const code = `
${js.getImportStatements()}
export default ${routesCode}`;
        return code;
      }
    }
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
