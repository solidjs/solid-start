import type * as babel from "@babel/core";
import type { Binding } from "@babel/traverse";
import * as t from "@babel/types";
import { bubbleFunctionDeclaration } from "./bubble-function-declaration.ts";
import { generateUniqueName } from "./generate-unique-name.ts";
import { getHierarchicalName } from "./get-hierarchical-name.ts";
import { getImportIdentifier } from "./get-import-identifier.ts";
import { getRootStatementPath } from "./get-root-statement-path.ts";
import { isStatementTopLevel } from "./is-statement-top-level.ts";
import { isPathValid, unwrapPath } from "./paths.ts";
import { removeUnusedVariables } from "./remove-unused-variables.ts";
import type { ImportDefinition } from "./types.ts";
import xxHash32 from "./xxhash32.ts";
import {
  assertHoistable,
  assertNoMethodDirectives,
  collectMisplacedDirectives,
} from "./validate.ts";

export interface StateContext {
  env: "production" | "development";
  mode: "server" | "client";
  directive: string;
  hash: string;
  count: number;
  /** How many times each name path has been used, to keep ids unique. */
  names: Map<string, number>;
  imports: Map<string, t.Identifier>;
  valid: boolean;
  warnings: string[];

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

function createID(ctx: StateContext, path: babel.NodePath) {
  const name = getHierarchicalName(path);
  // Two functions can still share a name path, such as two arrows passed to
  // the same call, so repeats are numbered.
  const seen = ctx.names.get(name) ?? 0;
  ctx.names.set(name, seen + 1);
  const unique = seen === 0 ? name : `${name}$${seen}`;
  ctx.count++;
  if (ctx.env === "development") {
    return `${ctx.hash}-${unique}`;
  }
  // Production ids stay opaque, so source names are not shipped to the browser.
  return `${ctx.hash}-${xxHash32(unique).toString(16)}`;
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
  // The function is about to be moved to the top level of the module, so
  // everything it reads has to still resolve from there.
  assertHoistable(path, ctx.directive);
  // First, get root statement
  const rootStatement = getRootStatementPath(path);

  // Create a unique ID for the function
  const fnID = createID(ctx, path);

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

  path.scope.crawl();
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

          // Only valid for functions
          const func = unwrapPath(current.path.get("init"), isValidFunction);
          if (func) {
            return current;
          }
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

interface ModuleExport {
  names: string[];
  path: babel.NodePath<ValidFunction>;
}

/**
 * An export a `"${directive}"` module cannot serve is left out of the client
 * build, so client code importing it gets a missing binding. The transform
 * cannot tell a wrapped function such as `query(fn, key)` from a plain value,
 * so this reports the export instead of failing the build.
 */
function droppedExport(ctx: StateContext, path: babel.NodePath, detail: string): void {
  const line = path.node.loc?.start.line;
  ctx.warnings.push(
    `A "${ctx.directive}" module can only serve the functions it declares, so this export is left out of the client build` +
      `${line == null ? "" : ` (line ${line})`}. ${detail}`,
  );
}

function isTypeOnlyDeclaration(node: t.Node | null | undefined): boolean {
  switch (node?.type) {
    case "TSInterfaceDeclaration":
    case "TSTypeAliasDeclaration":
    case "TSDeclareFunction":
    case "TSModuleDeclaration":
      return true;
    default:
      return false;
  }
}

function resolveExportedFunction(
  path: babel.NodePath,
  name: string,
): babel.NodePath<ValidFunction> | undefined {
  const binding = traceBinding(path, name);
  if (binding && isPathValid(binding.path, t.isVariableDeclarator)) {
    return unwrapPath(binding.path.get("init"), isValidFunction);
  }
  return undefined;
}

/**
 * Every function a `"use server"` module exports, in source order, with the
 * names it is exported under. Both modes walk this list in the same order,
 * which is what keeps the ids generated on the two sides pointing at each
 * other.
 */
function collectModuleExports(
  ctx: StateContext,
  program: babel.NodePath<t.Program>,
): ModuleExport[] {
  const entries: ModuleExport[] = [];
  const byNode = new Map<t.Node, ModuleExport>();

  function add(name: string, path: babel.NodePath<ValidFunction>): void {
    const existing = byNode.get(path.node);
    if (existing) {
      existing.names.push(name);
      return;
    }
    const entry: ModuleExport = { names: [name], path };
    byNode.set(path.node, entry);
    entries.push(entry);
  }

  program.traverse({
    ExportAllDeclaration(path) {
      if (path.node.exportKind === "type") {
        return;
      }
      droppedExport(
        ctx,
        path,
        '"export * from" re-exports nothing the client can call. Re-export from a module without the directive instead.',
      );
    },
    ExportDefaultDeclaration(path) {
      const declaration = path.get("declaration");
      const id = unwrapPath(declaration, t.isIdentifier);
      if (id) {
        const fn = resolveExportedFunction(path, id.node.name);
        if (fn) {
          add("default", fn);
        } else {
          droppedExport(ctx, path, `"${id.node.name}" is not a function declared in this module.`);
        }
        return;
      }
      // `export default async function () {}` is only a declaration by
      // position and has no binding to trace, so read it as an expression.
      if (isPathValid(declaration, t.isFunctionDeclaration) && !declaration.node.id) {
        const node = declaration.node;
        declaration.replaceWith(
          t.functionExpression(null, node.params, node.body, node.generator, node.async),
        );
      }
      const fn = unwrapPath(path.get("declaration"), isValidFunction);
      if (fn) {
        add("default", fn);
      } else {
        droppedExport(ctx, path, "The default export is not a function declared in this module.");
      }
    },
    ExportNamedDeclaration(path) {
      if (path.node.exportKind === "type") {
        return;
      }
      if (path.node.source) {
        droppedExport(
          ctx,
          path,
          "Re-exporting from another module is not supported. Export a function declared here that calls it instead.",
        );
        return;
      }
      for (const specifier of path.get("specifiers")) {
        if (!isPathValid(specifier, t.isExportSpecifier)) {
          droppedExport(ctx, specifier, "Only named exports of functions are supported.");
          continue;
        }
        if (specifier.node.exportKind === "type") {
          continue;
        }
        const local = specifier.node.local.name;
        const fn = resolveExportedFunction(specifier, local);
        if (!fn) {
          droppedExport(ctx, specifier, `"${local}" is not a function declared in this module.`);
          continue;
        }
        const exported = specifier.node.exported;
        add(t.isIdentifier(exported) ? exported.name : exported.value, fn);
      }

      const declaration = path.get("declaration");
      if (isPathValid(declaration, t.isVariableDeclaration)) {
        for (const declarator of declaration.get("declarations")) {
          const left = unwrapPath(declarator.get("id"), t.isIdentifier);
          if (!left) {
            droppedExport(ctx, declarator, "Destructured exports are not supported.");
            continue;
          }
          const fn = resolveExportedFunction(left, left.node.name);
          if (!fn) {
            droppedExport(ctx, declarator, `"${left.node.name}" is not a function.`);
            continue;
          }
          add(left.node.name, fn);
        }
      } else if (
        declaration.node &&
        !isPathValid(declaration, t.isFunctionDeclaration) &&
        !isTypeOnlyDeclaration(declaration.node)
      ) {
        droppedExport(ctx, declaration as babel.NodePath, "Only functions can be exported.");
      }
    },
  });

  return entries;
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

  const entries = collectModuleExports(ctx, program);

  if (ctx.mode === "server") {
    for (const entry of entries) {
      transformFunction(ctx, entry.path, true);
    }
    return;
  }

  const ids = entries.map(entry => createID(ctx, entry.path));

  // clear body
  program.node.body = [];

  const declarations: t.VariableDeclarator[] = [];
  const specifiers: t.ExportSpecifier[] = [];

  for (let i = 0, len = entries.length; i < len; i++) {
    const local = generateUniqueName(program, "fn");
    declarations.push(
      t.variableDeclarator(
        local,
        t.callExpression(getImportIdentifier(ctx.imports, program, ctx.definitions.clone), [
          t.stringLiteral(ids[i]!),
        ]),
      ),
    );
    for (const name of entries[i]!.names) {
      specifiers.push(t.exportSpecifier(local, t.stringLiteral(name)));
    }
  }

  const body: t.Statement[] = [];

  if (declarations.length > 0) {
    body.push(t.variableDeclaration("const", declarations));
  }
  if (specifiers.length > 0) {
    body.push(t.exportNamedDeclaration(null, specifiers, null));
  }

  program.pushContainer("body", body);
}

interface State extends babel.PluginPass {
  opts: StateContext;
}

export function directivesPlugin(): babel.PluginObj<State> {
  return {
    name: "solid-start:directives",
    visitor: {
      Program(program, ctx) {
        assertNoMethodDirectives(program, ctx.opts.directive);
        ctx.opts.warnings.push(...collectMisplacedDirectives(program, ctx.opts.directive));

        const isModuleLevel = isDirectiveValid(ctx.opts, program.node.directives);
        if (isModuleLevel) {
          transformModuleLevelDirective(ctx.opts, program);
          ctx.opts.valid = true;
        } else {
          // First, bubble up function declarations
          program.traverse({
            FunctionDeclaration(child) {
              // if (isFunctionDirectiveValid(ctx.opts, child)) {
              bubbleFunctionDeclaration(child);
              // }
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

          if (ctx.opts.count > 0) {
            ctx.opts.valid = true;
            removeUnusedVariables(program);
          }
        }
      },
    },
  };
}
