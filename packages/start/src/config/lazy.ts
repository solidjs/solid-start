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
              t.variableDeclarator(t.identifier("id$$"), t.stringLiteral(id)),
            ]),
          ),
        );
      },
    },
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
                t.stringLiteral("@solidjs/start/server"),
              ),
            );
          },
        });
      },
    },
  };
};

const fileEndingRegex = /(ts|js)x(\?.*)?$/;

const lazy = (): PluginOption => {
  const cwd = process.cwd().replaceAll(osSep, sep);

  /**
   * Maps module ids to their client-specific shared chunk names.
   * Modules in shared chunks need to find their assets via the chunk name, instead of their module id.
   *
   * Vite includes assets of such modules in the manifest via the chunk name:
   * https://github.com/vitejs/vite/blob/4be37a8389c67873880f826b01fe40137e1c29a7/packages/vite/src/node/plugins/manifest.ts#L179
   * https://github.com/vitejs/vite/blob/4be37a8389c67873880f826b01fe40137e1c29a7/packages/vite/src/node/plugins/manifest.ts#L319
   *
   * Rollup occassionally creates shared chunks automatically,
   * but they can also be manually created by the user via:
   * https://rollupjs.org/configuration-options/#output-manualchunks
   *
   * More infos on Rollup's logic:
   * https://github.com/rollup/rollup/issues/3772#issuecomment-689955168
   */
  const sharedChunkNames: Record<string, string> = {};

  return {
    name: "solid-lazy-css",
    enforce: "pre",
    generateBundle(_, bundle) {
      if (this.environment.name !== VITE_ENVIRONMENTS.client) return;

      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk" || !chunk.isDynamicEntry || chunk.facadeModuleId) continue;

        // Has to follow Vites implementation:
        // https://github.com/vitejs/vite/blob/4be37a8389c67873880f826b01fe40137e1c29a7/packages/vite/src/node/plugins/manifest.ts#L179
        const chunkName = `_${basename(chunk.fileName)}`;
        for (const id of chunk.moduleIds) {
          sharedChunkNames[id] = chunkName;
        }
      }
    },
    async transform(src, id) {
      if (this.environment.name !== VITE_ENVIRONMENTS.server) return;
      if (!id.match(fileEndingRegex)) return;

      // The transformed files either import "lazy" or css files
      // Therefore we skip, if the src doesn't have any import
      if (src.indexOf("import") === -1) return;

      const plugins: PluginItem[] = [];

      const hasDefaultExport = src.indexOf("export default") !== -1;
      if (hasDefaultExport) {
        const localId = relative(cwd, id);
        const chunkName = sharedChunkNames[id];
        plugins.push(idTransform(chunkName ?? localId));
      }

      const hasLazy = src.indexOf("lazy(") !== -1;
      if (hasLazy) plugins.push(importTransform());

      if (!plugins.length) {
        return;
      }

      const transformed = await babel.transformAsync(src, {
        plugins,
        parserOpts: {
          plugins: ["jsx", "typescript"],
        },
        filename: basename(id),
        ast: false,
        sourceMaps: true,
        configFile: false,
        babelrc: false,
        sourceFileName: id,
      });

      if (!transformed?.code) return;

      const { code, map } = transformed;
      return { code, map };
    },
  };
};

export default lazy;
