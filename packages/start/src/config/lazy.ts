import type { PluginItem } from "@babel/core";
import babel from "@babel/core";
import * as t from "@babel/types";
import { sep as osSep } from "node:path";
import { basename, relative, sep } from "node:path/posix";
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

// Matches vite-plugin-solid's placeholder, which its transform hook resolves
// to a project-root-relative module id via Vite's resolver.
const LAZY_PLACEHOLDER_PREFIX = "__SOLID_LAZY_MODULE__:";

const extractDynamicImportSpecifier = (node: t.Node): string | null => {
  if (!t.isArrowFunctionExpression(node) && !t.isFunctionExpression(node)) return null;

  let callExpr: t.CallExpression | null = null;
  if (t.isCallExpression(node.body)) {
    callExpr = node.body;
  } else if (
    t.isBlockStatement(node.body) &&
    node.body.body.length === 1 &&
    t.isReturnStatement(node.body.body[0]) &&
    t.isCallExpression(node.body.body[0].argument)
  ) {
    callExpr = node.body.body[0].argument;
  }

  if (!callExpr || !t.isImport(callExpr.callee)) return null;
  if (callExpr.arguments.length !== 1) return null;
  const arg = callExpr.arguments[0]!;
  if (!t.isStringLiteral(arg)) return null;

  return arg.value;
};

const importTransform = (): PluginItem => {
  return {
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value !== "solid-js") return;
        path.traverse({
          ImportSpecifier(subPath) {
            if (subPath.node.local.name !== "lazy") return;

            // Solid 2 requires a moduleUrl second argument for lazy() in SSR.
            // vite-plugin-solid only injects it for lazy imported from "solid-js",
            // so inject its placeholder here before rewriting the import source.
            const binding = subPath.scope.getBinding(subPath.node.local.name);
            for (const ref of binding?.referencePaths ?? []) {
              const call = ref.parentPath;
              if (!call?.isCallExpression() || call.node.callee !== ref.node) continue;
              if (call.node.arguments.length !== 1) continue;
              const specifier = extractDynamicImportSpecifier(call.node.arguments[0]!);
              if (!specifier) continue;
              call.node.arguments.push(t.stringLiteral(LAZY_PLACEHOLDER_PREFIX + specifier));
            }

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
