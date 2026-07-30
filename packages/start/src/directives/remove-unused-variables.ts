import type * as babel from "@babel/core";
import * as t from "@babel/types";
import { isPathValid } from "./paths.ts";

function isInvalidForRemoval(path: babel.NodePath) {
  if (isPathValid(path, t.isCatchClause)) {
    // This case is for `catch (error)` blocks
    return true;
  }

  // This one is for destructured variables
  let target = path;
  if (isPathValid(path, t.isVariableDeclarator)) {
    target = path.get("id");
  }
  return isPathValid(target, t.isObjectPattern) || isPathValid(target, t.isArrayPattern);
}

function countValidImport(node: t.ImportDeclaration): number {
  if (node.importKind === "type") {
    return 0;
  }

  let count = 0;

  for (const specifier of node.specifiers) {
    if (specifier.type !== "ImportSpecifier" || specifier.importKind === "value") {
      count += 1;
    }
  }

  return count;
}

export function removeUnusedVariables(program: babel.NodePath<t.Program>) {
  // TODO(Alexis):
  // This implementation is simple but slow
  // We repeat removing unused variables from each pass
  // until no potential unused variables are left.
  // There might be a simpler implementation.
  let dirty = true;

  while (dirty) {
    dirty = false;
    program.traverse({
      BindingIdentifier(path) {
        const binding = path.scope.getBinding(path.node.name);

        if (binding) {
          switch (binding.kind) {
            case "const":
            case "let":
            case "var":
            case "hoisted":
            case "module":
              if (binding.references === 0 && !binding.path.removed) {
                const parent = binding.path.parentPath;
                if (isPathValid(parent, t.isImportDeclaration)) {
                  if (countValidImport(parent.node) <= 1) {
                    parent.remove();
                  } else {
                    binding.path.remove();
                  }
                  dirty = true;
                } else if (!isInvalidForRemoval(binding.path)) {
                  binding.path.remove();
                  dirty = true;
                }
              }
              break;
            case "local":
            case "param":
            case "unknown":
              break;
          }
        }
      },
      VariableDeclaration(path) {
        if (path.node.declarations.length === 0) {
          path.remove();
        }
      },
    });
    program.scope.crawl();
  }
}
