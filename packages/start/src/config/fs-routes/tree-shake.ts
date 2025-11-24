// All credit for this work goes to the amazing Next.js team.
// https://github.com/vercel/next.js/blob/canary/packages/next/build/babel/plugins/next-ssg-transform.ts
// This is adapted to work with routeData functions. It can be run in two modes, one which preserves the routeData and the Component in the same file, and one which creates a

import type * as Babel from "@babel/core";
import type { NodePath, PluginObj, PluginPass } from "@babel/core";
import type { Binding } from "@babel/traverse";
import { basename } from "pathe";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

type State = Omit<PluginPass, "opts"> & {
  opts: { pick: string[] };
  refs: Set<any>;
  done: boolean;
};

function treeShakeTransform({ types: t }: typeof Babel): PluginObj<State> {
  function getIdentifier(path: any) {
    const parentPath = path.parentPath;
    if (parentPath.type === "VariableDeclarator") {
      const pp = parentPath;
      const name = pp.get("id");
      return name.node.type === "Identifier" ? name : null;
    }
    if (parentPath.type === "AssignmentExpression") {
      const pp = parentPath;
      const name = pp.get("left");
      return name.node.type === "Identifier" ? name : null;
    }
    if (path.node.type === "ArrowFunctionExpression") {
      return null;
    }
    return path.node.id && path.node.id.type === "Identifier" ? path.get("id") : null;
  }

  function isIdentifierReferenced(ident: any) {
    const b: Binding | undefined = ident.scope.getBinding(ident.node.name);
    if (b?.referenced) {
      if (b.path.type === "FunctionDeclaration") {
        return !b.constantViolations
          .concat(b.referencePaths)
          .every(ref => ref.findParent(p => p === b.path));
      }
      return true;
    }
    return false;
  }
  function markFunction(path: any, state: any) {
    const ident = getIdentifier(path);
    if (ident && ident.node && isIdentifierReferenced(ident)) {
      state.refs.add(ident);
    }
  }
  function markImport(path: any, state: any) {
    const local = path.get("local");
    if (isIdentifierReferenced(local)) {
      state.refs.add(local);
    }
  }

  return {
    visitor: {
      Program: {
        enter(path, state) {
          state.refs = new Set();
          state.done = false;
          path.traverse(
            {
              VariableDeclarator(variablePath, variableState: any) {
                if (variablePath.node.id.type === "Identifier") {
                  const local = variablePath.get("id");
                  if (isIdentifierReferenced(local)) {
                    variableState.refs.add(local);
                  }
                } else if (variablePath.node.id.type === "ObjectPattern") {
                  const pattern = variablePath.get("id");
                  const properties = pattern.get("properties") as Array<NodePath>;
                  properties.forEach(p => {
                    const local = p.get(
                      p.node.type === "ObjectProperty"
                        ? "value"
                        : p.node.type === "RestElement"
                          ? "argument"
                          : (() => {
                              throw new Error("invariant");
                            })()
                    );
                    if (isIdentifierReferenced(local)) {
                      variableState.refs.add(local);
                    }
                  });
                } else if (variablePath.node.id.type === "ArrayPattern") {
                  const pattern = variablePath.get("id");
                  const elements = pattern.get("elements") as Array<NodePath>;
                  elements.forEach(e => {
                    let local: NodePath<any>;
                    if (e.node && e.node.type === "Identifier") {
                      local = e;
                    } else if (e.node && e.node.type === "RestElement") {
                      local = e.get("argument");
                    } else {
                      return;
                    }
                    if (isIdentifierReferenced(local)) {
                      variableState.refs.add(local);
                    }
                  });
                }
              },
              ExportDefaultDeclaration(exportNamedPath) {
                // if opts.keep is true, we don't remove the routeData export
                if (state.opts.pick && !state.opts.pick.includes("default")) {
                  exportNamedPath.remove();
                }
              },
              ExportNamedDeclaration(exportNamedPath) {
                // if opts.keep is false, we don't remove the routeData export
                if (!state.opts.pick) {
                  return;
                }
                const specifiers = exportNamedPath.get("specifiers");
                if (specifiers.length) {
                  specifiers.forEach(s => {
                    if (
                      t.isIdentifier(s.node.exported)
                        ? s.node.exported.name
                        : state.opts.pick.includes(s.node.exported.value)
                    ) {
                      s.remove();
                    }
                  });
                  if (exportNamedPath.node.specifiers.length < 1) {
                    exportNamedPath.remove();
                  }
                  return;
                }
                const decl = exportNamedPath.get("declaration");
                if (decl == null || decl.node == null) {
                  return;
                }
                switch (decl.node.type) {
                  case "FunctionDeclaration": {
                    const name = decl.node.id?.name;
                    if (name && state.opts.pick && !state.opts.pick.includes(name)) {
                      exportNamedPath.remove();
                    }
                    break;
                  }
                  case "VariableDeclaration": {
                    const inner = decl.get("declarations") as Array<NodePath<any>>;
                    inner.forEach(d => {
                      if (d.node.id.type !== "Identifier") {
                        return;
                      }
                      const name = d.node.id.name;
                      if (state.opts.pick && !state.opts.pick.includes(name)) {
                        d.remove();
                      }
                    });
                    break;
                  }
                  default: {
                    break;
                  }
                }
              },
              FunctionDeclaration: markFunction,
              FunctionExpression: markFunction,
              ArrowFunctionExpression: markFunction,
              ImportSpecifier: markImport,
              ImportDefaultSpecifier: markImport,
              ImportNamespaceSpecifier: markImport,
              ImportDeclaration: (path, state) => {
                if (
                  path.node.source.value.endsWith(".css") &&
                  state.opts.pick &&
                  !state.opts.pick.includes("$css")
                ) {
                  path.remove();
                }
              }
            },
            state
          );

          const refs = state.refs;
          let count = 0;
          const sweepFunction = (sweepPath: any) => {
            const ident = getIdentifier(sweepPath);
            if (ident && ident.node && refs.has(ident) && !isIdentifierReferenced(ident)) {
              ++count;
              if (
                t.isAssignmentExpression(sweepPath.parentPath) ||
                t.isVariableDeclarator(sweepPath.parentPath)
              ) {
                sweepPath.parentPath.remove();
              } else {
                sweepPath.remove();
              }
            }
          };
          function sweepImport(sweepPath: any) {
            const local = sweepPath.get("local");
            if (refs.has(local) && !isIdentifierReferenced(local)) {
              ++count;
              sweepPath.remove();
              if (sweepPath.parent.specifiers.length === 0) {
                sweepPath.parentPath.remove();
              }
            }
          }
          do {
            path.scope.crawl();
            count = 0;
            path.traverse({
              VariableDeclarator(variablePath) {
                if (variablePath.node.id.type === "Identifier") {
                  const local = variablePath.get("id");
                  if (refs.has(local) && !isIdentifierReferenced(local)) {
                    ++count;
                    variablePath.remove();
                  }
                } else if (variablePath.node.id.type === "ObjectPattern") {
                  const pattern = variablePath.get("id");
                  const beforeCount = count;
                  const properties = pattern.get("properties");
                  properties.forEach(p => {
                    const local = p.get(
                      p.node.type === "ObjectProperty"
                        ? "value"
                        : p.node.type === "RestElement"
                          ? "argument"
                          : (() => {
                              throw new Error("invariant");
                            })()
                    );
                    if (refs.has(local) && !isIdentifierReferenced(local)) {
                      ++count;
                      p.remove();
                    }
                  });
                  if (beforeCount !== count && pattern.get("properties").length < 1) {
                    variablePath.remove();
                  }
                } else if (variablePath.node.id.type === "ArrayPattern") {
                  const pattern = variablePath.get("id");
                  const beforeCount = count;
                  const elements = pattern.get("elements");
                  elements.forEach(e => {
                    let local: NodePath<any> | undefined;
                    if (e.node && e.node.type === "Identifier") {
                      local = e;
                    } else if (e.node && e.node.type === "RestElement") {
                      local = e.get("argument");
                    } else {
                      return;
                    }
                    if (refs.has(local) && !isIdentifierReferenced(local)) {
                      ++count;
                      e.remove();
                    }
                  });
                  if (beforeCount !== count && pattern.get("elements").length < 1) {
                    variablePath.remove();
                  }
                }
              },
              FunctionDeclaration: sweepFunction,
              FunctionExpression: sweepFunction,
              ArrowFunctionExpression: sweepFunction,
              ImportSpecifier: sweepImport,
              ImportDefaultSpecifier: sweepImport,
              ImportNamespaceSpecifier: sweepImport
            });
          } while (count);
        }
      }
    }
  };
}

export function treeShake(): Plugin {
  let config: ResolvedConfig;
  const cache: Record<string, any> = {};
  let server: ViteDevServer;

  async function transform(id: string, code: string) {
    const [path, queryString] = id.split("?");
    const query = new URLSearchParams(queryString);
    if (query.has("pick")) {
      const babel = await import("@babel/core");
      const transformed = await babel.transformAsync(code, {
        plugins: [[treeShakeTransform, { pick: query.getAll("pick") }]],
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

      return transformed;
    }
  }
  return {
    name: "tree-shake",
    enforce: "pre",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    configureServer(s) {
      server = s;
    },
    async handleHotUpdate(ctx) {
      if (cache[ctx.file]) {
        const mods = [];
        const newCode = await ctx.read();
        for (const [id, code] of Object.entries(cache[ctx.file])) {
          const transformed = await transform(id, newCode);
          if (!transformed) continue;

          const { code: transformedCode } = transformed;

          if (transformedCode !== code) {
            const mod = server.moduleGraph.getModuleById(id);
            if (mod) mods.push(mod);
          }

          cache[ctx.file] ??= {};
          cache[ctx.file][id] = transformedCode;
          // server.moduleGraph.setModuleSource(id, code);
        }

        return mods;
      }
      // 	const mods = [];
      // 	[...server.moduleGraph.urlToModuleMap.entries()].forEach(([url, m]) => {
      // 		if (m.file === ctx.file && m.id.includes("pick=")) {
      // 			if (!m.id.includes("pick=loader")) {
      // 				mods.push(m);
      // 			}
      // 		}
      // 	});
      // 	return mods;
      // 	// this.router.updateRoute(ctx.path);
      // }
    },
    async transform(code, id) {
      const [path, queryString] = id.split("?");
      if (!path) return;
      const query = new URLSearchParams(queryString);
      const ext = path.split(".").pop();
      if (!ext) return;
      if (query.has("pick") && ["js", "jsx", "ts", "tsx"].includes(ext)) {
        const transformed = await transform(id, code);
        if (!transformed?.code) return;

        cache[path] ??= {};
        cache[path][id] = transformed.code;

        return {
          code: transformed.code,
          map: transformed.map
        };
      }
    }
  };
}
