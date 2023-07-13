// @ts-nocheck
// All credit for this work goes to the amazing Next.js team.
// https://github.com/vercel/next.js/blob/canary/packages/next/build/babel/plugins/next-ssg-transform.ts
// This is adapted to work with any server$() calls and transpile it into multiple api function for a file.

import crypto from "crypto";
import nodePath from "path";

const INLINE_SERVER_ROUTE_PREFIX = "/_m";

/** @typedef {{ refs: Set<import('@babel/core').NodePath<import('@babel/core').types.Identifier>>,  filename: string, done: {}, servers: number; opts: { minify: boolean; root: string; ssr: boolean; } }} State */

/**
 *
 * @param {{ types: import('@babel/core').types; template: import('@babel/core').template }} param0
 * @returns {import('@babel/core').PluginObj<State>}
 */
function transformServer({ types: t, template }) {
  /**
   * @param {import('@babel/core').NodePath} path
   * @return {import('@babel/core').NodePath<import('@babel/core').types.Identifier> | null}
   * */
  function getIdentifier(path) {
    const parentPath = path.parentPath;
    if (!parentPath) {
      return null;
    } else if (parentPath.isVariableDeclarator()) {
      const pp = parentPath;
      const name = pp.get("id");

      if (Array.isArray(name)) {
        return null;
      } else {
        return name.isIdentifier() ? name : null;
      }
    } else if (parentPath.isAssignmentExpression()) {
      const pp = parentPath;
      const name = pp.get("left");
      if (Array.isArray(name)) {
        return null;
      } else {
        return name.isIdentifier() ? name : null;
      }
    }
    if (path.isArrowFunctionExpression()) {
      return null;
    }

    let name = path.get("id");
    if (Array.isArray(name)) {
      return null;
    } else {
      return name.isIdentifier() ? name : null;
    }
  }

  /** @param {import('@babel/core').NodePath<import('@babel/core').types.Identifier>} ident  */
  function isIdentifierReferenced(ident) {
    const b = ident.scope.getBinding(ident.node.name);
    if (b && b.referenced) {
      if (b.path.type === "FunctionDeclaration") {
        return !b.constantViolations
          .concat(b.referencePaths)
          .every(ref => ref.findParent(p => p === b.path));
      }
      return true;
    }
    return false;
  }

  /**
   * @param {import('@babel/core').NodePath} path
   * @param {State} state
   */
  function markFunction(path, state) {
    const ident = getIdentifier(path);
    if (ident && isIdentifierReferenced(ident)) {
      state.refs.add(ident);
    }
  }

  function markImport(
    /** @type {import('@babel/core').NodePath<import('@babel/core').types.ImportSpecifier | import('@babel/core').types.ImportDefaultSpecifier | import('@babel/core').types.ImportNamespaceSpecifier>} */ path,
    /** @type {State} */ state
  ) {
    const local = path.get("local");
    // if (isIdentifierReferenced(local)) {
    state.refs.add(local);
    // }
  }

  function hashFn(/** @type {string} */ str) {
    return crypto
      .createHash("shake256", { outputLength: 5 /* bytes = 10 hex digits*/ })
      .update(str)
      .digest("hex");
  }

  return {
    visitor: {
      Program: {
        enter(path, state) {
          state.refs = new Set();
          state.done = false;
          state.servers = 0;
          path.traverse(
            {
              VariableDeclarator(variablePath, variableState) {
                let id = variablePath.get("id");
                if (id.isIdentifier()) {
                  if (isIdentifierReferenced(id)) {
                    variableState.refs.add(id);
                  }
                } else if (id.isObjectPattern()) {
                  // /** @type {import('@babel/core').NodePath<import('@babel/core').Node>[]} */
                  const properties = id.get("properties");
                  properties.forEach(p => {
                    const local = p.isObjectProperty()
                      ? p.get("value")
                      : p.isRestElement()
                      ? p.get("argument")
                      : (function () {
                          throw new Error("invariant");
                        })();

                    if (isIdentifierReferenced(local)) {
                      variableState.refs.add(local);
                    }
                  });
                } else if (id.isArrayPattern()) {
                  const elements = id.get("elements");
                  elements.forEach(e => {
                    let local;
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
              CallExpression: path => {
                let callee = path.get("callee");
                let program = path.findParent(p => t.isProgram(p));
                if (program != null && callee.isIdentifier() && callee.node.name === "server$") {
                  const serverFn = path.get("arguments")[0];
                  let body = program.get("body");
                  let statement = path.findParent(p =>
                    Array.isArray(body) ? body.includes(p) : body === p
                  );
                  let decl = path.findParent(
                    p =>
                      p.isVariableDeclarator() || p.isFunctionDeclaration() || p.isObjectProperty()
                  );
                  const serverResource = path.getData("serverResource") ?? false;
                  let serverIndex = state.servers++;
                  let hasher = state.opts.minify ? hashFn : (/** @type {string} */ str) => str;
                  const fName = state.filename.replace(state.opts.root, "").slice(1);

                  const hash = hasher(nodePath.join(fName, String(serverIndex)));

                  serverFn.traverse({
                    MemberExpression(path) {
                      let obj = path.get("object");
                      if (obj.node.type === "Identifier" && obj.node.name === "server$") {
                        obj.replaceWith(t.identifier("$$ctx"));
                        return;
                      }
                    }
                  });

                  if (serverFn.node.type === "ArrowFunctionExpression") {
                    const body = serverFn.get("body");

                    if (Array.isArray(body)) {
                      // throw new Error("invariant");
                      return;
                    }

                    if (body.isExpression()) {
                      const block = t.blockStatement([t.returnStatement(body.node)]);
                      body.replaceWith(block);
                    }

                    serverFn.replaceWith(
                      t.functionExpression(
                        t.identifier("$$serverHandler" + serverIndex),
                        serverFn.node.params,
                        body.node,
                        false,
                        true
                      )
                    );
                  }

                  if (serverFn.node.type === "FunctionExpression") {
                    serverFn
                      .get("body")
                      .unshiftContainer(
                        "body",
                        t.variableDeclaration("const", [
                          t.variableDeclarator(t.identifier("$$ctx"), t.thisExpression())
                        ])
                      );
                  }

                  const route = nodePath
                    .join(
                      INLINE_SERVER_ROUTE_PREFIX,
                      hash,
                      decl?.node.id?.elements?.[0]?.name ??
                        decl?.node.id?.name ??
                        decl?.node.key?.name ??
                        "fn"
                    )
                    .replaceAll("\\", "/");

                  if (state.opts.ssr) {
                    statement.insertBefore(
                      template(`
                      const $$server_module${serverIndex} = server$.createHandler(%%source%%, "${route}", ${serverResource});
                      server$.registerHandler("${route}", $$server_module${serverIndex});
                      `)({
                        source: serverFn.node
                      })
                    );
                  } else {
                    statement.insertBefore(
                      template(
                        `
                        ${
                          process.env.TEST_ENV === "client"
                            ? `server$.registerHandler("${route}", server$.createHandler(%%source%%, "${route}", ${serverResource}));`
                            : ``
                        }
                        const $$server_module${serverIndex} = server$.createFetcher("${route}", ${serverResource});`,
                        {
                          syntacticPlaceholders: true
                        }
                      )(
                        process.env.TEST_ENV === "client"
                          ? {
                              source: serverFn.node
                            }
                          : {}
                      )
                    );
                  }
                  path.replaceWith(t.identifier(`$$server_module${serverIndex}`));
                }
              },
              FunctionDeclaration: markFunction,
              FunctionExpression: markFunction,
              ArrowFunctionExpression: markFunction,
              ImportSpecifier: markImport,
              ImportDefaultSpecifier: markImport,
              ImportNamespaceSpecifier: markImport
            },
            state
          );

          const refs = state.refs;
          /** @type {number} */
          let count;

          function sweepFunction(/** @type {import('@babel/core').NodePath} */ sweepPath) {
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
          }

          function sweepImport(/** @type {import('@babel/core').NodePath} */ sweepPath) {
            const local = sweepPath.get("local");
            if (refs.has(local) && !isIdentifierReferenced(local)) {
              ++count;
              sweepPath.remove();
              if (!state.opts.ssr) {
                if (sweepPath.parent.specifiers.length === 0) {
                  sweepPath.parentPath.remove();
                }
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
                  let props = Array.isArray(properties) ? properties : [properties];
                  props.forEach(p => {
                    const local = p.get(
                      p.node.type === "ObjectProperty"
                        ? "value"
                        : p.node.type === "RestElement"
                        ? "argument"
                        : (function () {
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
                    let local;
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
export { transformServer as default };
