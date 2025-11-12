import type { PluginItem } from "@babel/core";
import babel from "@babel/core";
import * as t from "@babel/types";
import { sep as osSep } from "path";
import { basename, relative, sep } from "path/posix";
import type { PluginOption } from "vite";
import { VITE_ENVIRONMENTS } from "./constants.ts";

const idTransform = (id: string): PluginItem => {
  return {
    visitor: {
      Program(path) {
        path.node.body.unshift(
          t.exportNamedDeclaration(
            t.variableDeclaration("const", [
              t.variableDeclarator(t.identifier("id$$"), t.stringLiteral(id))
            ])
          )
        );
      }
    }
  };
};

const importTransform = (): PluginItem => {
  return {
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value !== "solid-js") return;
        path.traverse({
          ImportSpecifier(subPath) {
            if (subPath.node.local.name !== "lazy") return;
            subPath.remove();
            path.insertAfter(
              t.importDeclaration(
                [t.importSpecifier(t.identifier("lazy"), t.identifier("lazy"))],
                t.stringLiteral("@solidjs/start/server")
              )
            );
          }
        });
      }
    }
  };
};

const fileEndingRegex = /(ts|js)x(\?.*)?$/;

const lazy = (): PluginOption => {
  const cwd = process.cwd().replaceAll(osSep, sep);
  return {
    name: "solid-lazy-css",
    enforce: "pre",
    applyToEnvironment(env) {
      return env.name === VITE_ENVIRONMENTS.server;
    },
    async transform(src, id) {
      if (!id.match(fileEndingRegex)) return;

      // The transformed files either import "lazy" or css files
      // Therefore we skip, if the src doesn't have any import
      if (src.indexOf("import") === -1) return;

      const plugins: PluginItem[] = [];

      const hasDefaultExport = src.indexOf("export default") !== -1;
      if (hasDefaultExport) {
        const localId = relative(cwd, id);
        plugins.push(idTransform(localId));
      }

      const hasLazy = src.indexOf("lazy(") !== -1;
      if (hasLazy) plugins.push(importTransform());

      if (!plugins.length) {
        return;
      }

      const transformed = await babel.transformAsync(src, {
        plugins,
        parserOpts: {
          plugins: ["jsx", "typescript"]
        },
        filename: basename(id),
        ast: false,
        sourceMaps: true,
        configFile: false,
        babelrc: false,
        sourceFileName: id
      });

      if (!transformed?.code) return;

      const { code, map } = transformed;
      return { code, map };
    }
  };
};

export default lazy;
