import type * as babel from "@babel/core";
import type { Binding } from "@babel/traverse";
import * as t from "@babel/types";
import { bubbleFunctionDeclaration } from "./bubble-function-declaration.ts";
import { generateUniqueName } from "./generate-unique-name.ts";
import { getDescriptiveName } from "./get-descriptive-name.ts";
import { getImportIdentifier } from "./get-import-identifier.ts";
import { getRootStatementPath } from "./get-root-statement-path.ts";
import { isStatementTopLevel } from "./is-statement-top-level.ts";
import { isPathValid, unwrapPath } from "./paths.ts";
import type { ImportDefinition } from "./types.ts";

export interface StateContext {
  env: "production" | "development";
  mode: "server" | "client";
  directive: string;
  hash: string;
  count: number;
  imports: Map<string, t.Identifier>;

  definitions: {
    register: ImportDefinition;
    clone: ImportDefinition;
  };
}

type ValidFunction = t.ArrowFunctionExpression | t.FunctionExpression;

function isValidFunction(node: t.Node): node is ValidFunction {
  return t.isArrowFunctionExpression(node) || t.isFunctionExpression(node);
}

function isDirectiveValid(ctx: StateContext, directives: t.Directive[]) {
  for (let i = 0, len = directives.length; i < len; i++) {
    if (directives[i]!.value.value === ctx.directive) {
      return true;
    }
  }
  return false;
}

function cleanDirectives(path: babel.NodePath<t.BlockStatement | t.Program>, target: string): void {
  const newDirectives: t.Directive[] = [];
  for (let i = 0, len = path.node.directives.length; i < len; i++) {
    const current = path.node.directives[i]!;
    if (current.value.value !== target) {
      newDirectives.push(current);
    }
  }
  path.node.directives = newDirectives;
}

function cleanFunctionDirectives(
  ctx: StateContext,
  path: babel.NodePath<t.FunctionDeclaration | ValidFunction>,
) {
  const body = path.get("body");

  if (isPathValid(body, t.isBlockStatement)) {
    cleanDirectives(body, ctx.directive);
  }
}

function isFunctionDirectiveValid(
  ctx: StateContext,
  path: babel.NodePath<t.FunctionDeclaration | ValidFunction>,
) {
  const body = path.get("body");

  if (isPathValid(body, t.isBlockStatement)) {
    return isDirectiveValid(ctx, body.node.directives);
  }

  return false;
}

function createID(ctx: StateContext, name: string) {
  const base = `${ctx.hash}-${ctx.count++}`;
  if (ctx.env === "development") {
    return `${base}-${name}`;
  }
  return base;
}

function transformFunction(
  ctx: StateContext,
  path: babel.NodePath<ValidFunction>,
  direct: boolean,
) {
  if (!direct) {
    if (!isFunctionDirectiveValid(ctx, path)) {
      return;
    }
    cleanFunctionDirectives(ctx, path);
  }
  // First, get root statement
  const rootStatement = getRootStatementPath(path);

  // Create a unique ID for the function
  const fnID = createID(ctx, getDescriptiveName(path, "anonymous"));

  if (ctx.mode === "server") {
    // Create a "source" function on the root-level
    const sourceReference = t.callExpression(
      getImportIdentifier(ctx.imports, path, ctx.definitions.register),
      [t.stringLiteral(fnID), path.node],
    );

    const sourceID = generateUniqueName(path, "serverFn");

    rootStatement.insertBefore(
      t.variableDeclaration("const", [t.variableDeclarator(sourceID, sourceReference)]),
    );

    // Clone the source function to replace the server function
    path.replaceWith(
      t.callExpression(getImportIdentifier(ctx.imports, path, ctx.definitions.clone), [sourceID]),
    );
  } else {
    // Otherwise, clone the function based on its ID
    path.replaceWith(
      t.callExpression(getImportIdentifier(ctx.imports, path, ctx.definitions.clone), [
        t.stringLiteral(fnID),
      ]),
    );
  }
}

function traceBinding(path: babel.NodePath, name: string): Binding | undefined {
  const current = path.scope.getBinding(name);
  if (!current) {
    return undefined;
  }
  switch (current.kind) {
    case "const":
    case "let":
    case "var": {
      if (isPathValid(current.path, t.isVariableDeclarator)) {
        // Check if left is identifier
        const left = unwrapPath(current.path.get("id"), t.isIdentifier);
        if (left) {
          const right = unwrapPath(current.path.get("init"), t.isIdentifier);
          if (right) {
            return traceBinding(path, right.node.name);
          }
          return current;
        }
      }
      return undefined;
    }
    case "hoisted":
    case "local":
    case "module":
    case "param":
    case "unknown":
      return undefined;
  }
}

function transformBindingForServer(ctx: StateContext, binding: Binding) {
  if (isPathValid(binding.path, t.isVariableDeclarator)) {
    const right = unwrapPath(binding.path.get("init"), isValidFunction);
    if (right) {
      transformFunction(ctx, right, true);
    }
  }
}

function treeshake(path: babel.NodePath, name: string): void {
  const binding = path.scope.getBinding(name);

  if (!(binding && binding.references + binding.constantViolations.length > 0)) {
    if (isPathValid(path.parentPath, t.isImportDeclaration)) {
      const parent = path.parentPath;
      if (parent.node.specifiers.length === 1) {
        parent.remove();
      } else {
        path.remove();
      }
    } else {
      path.remove();
    }
  }
}

interface State extends babel.PluginPass {
  opts: StateContext;
}

function transformModuleLevelDirective(ctx: StateContext, program: babel.NodePath<t.Program>) {
  cleanDirectives(program, ctx.directive);
  program.traverse({
    FunctionDeclaration(child) {
      // We only need to move top-level functions
      if (isStatementTopLevel(child)) {
        bubbleFunctionDeclaration(child);
      }
    },
  });
  program.scope.crawl();
  if (ctx.mode === "server") {
    // Trace bindings
    const bindings = new Set<Binding>();

    program.traverse({
      ExportDefaultDeclaration(path) {
        const id = unwrapPath(path.get("declaration"), t.isIdentifier);
        if (id) {
          const binding = traceBinding(path, id.node.name);
          if (binding) {
            bindings.add(binding);
          }
        }
      },
      ExportNamedDeclaration(path) {
        if (path.node.source || path.node.exportKind === "type") {
          return;
        }
        for (const specifier of path.get("specifiers")) {
          if (isPathValid(specifier, t.isExportSpecifier)) {
            const binding = traceBinding(specifier, specifier.node.local.name);

            if (binding) {
              bindings.add(binding);
            }
          }
        }
      },
    });

    for (const binding of bindings) {
      transformBindingForServer(ctx, binding);
    }
  } else {
    // Trace bindings
    const uniqueBindings = new Set<Binding>();
    const exportedBindings = new Map<string, Binding>();

    program.traverse({
      ExportDefaultDeclaration(path) {
        const id = unwrapPath(path.get("declaration"), t.isIdentifier);
        if (id) {
          const binding = traceBinding(path, id.node.name);
          if (binding) {
            uniqueBindings.add(binding);
            exportedBindings.set("default", binding);
          }
        }
      },
      ExportNamedDeclaration(path) {
        if (path.node.source || path.node.exportKind === "type") {
          return;
        }
        for (const specifier of path.get("specifiers")) {
          if (isPathValid(specifier, t.isExportSpecifier)) {
            const binding = traceBinding(specifier, specifier.node.local.name);

            if (binding) {
              const key = t.isIdentifier(specifier.node.exported)
                ? specifier.node.exported.name
                : specifier.node.exported.value;
              uniqueBindings.add(binding);
              exportedBindings.set(key, binding);
            }
          }
        }
      },
    });

    // generate ids for each unique binding
    const sourceIDs = new Map<Binding, string>();
    for (const binding of uniqueBindings) {
      if (isPathValid(binding.path, t.isVariableDeclarator)) {
        const init = unwrapPath(binding.path.get("init"), isValidFunction);
        if (init) {
          sourceIDs.set(binding, createID(ctx, getDescriptiveName(init, "anonymous")));
        }
      }
    }

    // clear body
    program.node.body = [];

    const declarations: t.VariableDeclarator[] = [];
    const specifiers: t.ExportSpecifier[] = [];

    const declarationMap = new Map<Binding, t.Identifier>();

    // Declare all client functions
    for (const [exported, binding] of exportedBindings) {
      let currentIdentifier = declarationMap.get(binding);
      if (!currentIdentifier) {
        currentIdentifier = generateUniqueName(program, "fn");

        const fnID = sourceIDs.get(binding);

        if (fnID) {
          declarations.push(
            t.variableDeclarator(
              currentIdentifier,
              t.callExpression(getImportIdentifier(ctx.imports, program, ctx.definitions.clone), [
                t.stringLiteral(fnID),
              ]),
            ),
          );

          declarationMap.set(binding, currentIdentifier);
        }
      }

      if (currentIdentifier) {
        specifiers.push(t.exportSpecifier(currentIdentifier, t.stringLiteral(exported)));
      }
    }

    program.pushContainer("body", [
      t.variableDeclaration("const", declarations),
      t.exportNamedDeclaration(null, specifiers, null),
    ]);
  }
}

export function directivesPlugin(): babel.PluginObj<State> {
  return {
    name: "solid-start:directives",
    visitor: {
      Program(program, ctx) {
        const isModuleLevel = isDirectiveValid(ctx.opts, program.node.directives);
        if (isModuleLevel) {
          transformModuleLevelDirective(ctx.opts, program);
        } else {
          // First, bubble up function declarations
          program.traverse({
            FunctionDeclaration(child) {
              if (isFunctionDirectiveValid(ctx.opts, child)) {
                bubbleFunctionDeclaration(child);
              }
            },
          });
          program.scope.crawl();
          // Now we transform each function
          program.traverse({
            ArrowFunctionExpression(path) {
              transformFunction(ctx.opts, path, false);
            },
            FunctionExpression(path) {
              transformFunction(ctx.opts, path, false);
            },
          });

          program.scope.crawl();
          // Tree-shaking
          program.traverse({
            ImportDefaultSpecifier(path) {
              treeshake(path, path.node.local.name);
            },
            ImportNamespaceSpecifier(path) {
              treeshake(path, path.node.local.name);
            },
            ImportSpecifier(path) {
              treeshake(path, path.node.local.name);
            },
          });
        }
      },
    },
  };
}
