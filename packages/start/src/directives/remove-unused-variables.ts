import type * as babel from "@babel/core";
import type { Binding } from "@babel/traverse";
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
    // The loop variable of `for...in` and `for...of` cannot be left out.
    if (path.parentPath.key === "left" && path.parentPath.parentPath?.isFor()) {
      return true;
    }
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

function isRemovableKind(binding: Binding): boolean {
  switch (binding.kind) {
    case "const":
    case "let":
    case "var":
    case "hoisted":
    case "module":
      return true;
    case "local":
    case "param":
    case "unknown":
      return false;
  }
}

/**
 * Removing a node drops the references it held. Bindings that lose their last
 * reference this way become unused too, so they are returned to be removed next.
 */
function dereferenceRemoved(path: babel.NodePath, unused: Binding[]): void {
  function dereference(child: babel.NodePath<t.Identifier | t.JSXIdentifier>): void {
    const binding = child.scope.getBinding(child.node.name);
    if (!binding || binding.references === 0 || !binding.referencePaths.includes(child)) {
      return;
    }
    binding.dereference();
    if (binding.references === 0) {
      unused.push(binding);
    }
  }
  if (path.isIdentifier() || path.isJSXIdentifier()) {
    dereference(path);
  }
  path.traverse({
    ReferencedIdentifier: dereference,
  });
}

function removeBinding(binding: Binding, unused: Binding[]): void {
  if (binding.path.removed || binding.references !== 0 || !isRemovableKind(binding)) {
    return;
  }
  const parent = binding.path.parentPath;
  let target: babel.NodePath;
  if (isPathValid(parent, t.isImportDeclaration)) {
    target = countValidImport(parent.node) <= 1 ? parent : binding.path;
  } else if (isInvalidForRemoval(binding.path)) {
    return;
  } else {
    target = binding.path;
  }
  // A repeated `var` declaration is tracked as a reassignment of the first one,
  // so it has to go along with it.
  const targets = [target];
  for (const violation of binding.constantViolations) {
    if (isPathValid(violation, t.isVariableDeclarator) && t.isIdentifier(violation.node.id)) {
      targets.push(violation);
    }
  }
  for (const current of targets) {
    if (!current.removed) {
      dereferenceRemoved(current, unused);
      current.remove();
    }
  }
}

/**
 * Removes declarations nothing reads. Removing one can leave another unused,
 * so each removal queues the bindings it was the last reader of, which avoids
 * walking the whole program again until nothing changes.
 */
export function removeUnusedVariables(program: babel.NodePath<t.Program>) {
  program.scope.crawl();

  const unused: Binding[] = [];
  program.traverse({
    BindingIdentifier(path) {
      const binding = path.scope.getBinding(path.node.name);
      if (binding && binding.identifier === path.node && binding.references === 0) {
        unused.push(binding);
      }
    },
  });

  // Oldest first, so declarations are removed in source order.
  for (let i = 0; i < unused.length; i++) {
    removeBinding(unused[i]!, unused);
  }
}
