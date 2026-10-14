import type { NodePath } from "@babel/core";
import * as t from "@babel/types";

/**
 * The names a function is nested under, from the top of the module down, joined
 * with a dot. `Page.load` for a `load` declared inside `Page`.
 *
 * Server function ids are built from this instead of the order the functions
 * appear in. An id then stays the same when another function is added to the
 * file, and two functions that share a name are still told apart by the names
 * around them.
 */

const ANONYMOUS = "anonymous";

function getKeyName(node: t.Node, computed: boolean): string | undefined {
  if (computed) {
    return undefined;
  }
  switch (node.type) {
    case "Identifier":
      return node.name;
    case "PrivateName":
      return node.id.name;
    case "StringLiteral":
      return node.value;
    case "NumericLiteral":
      return String(node.value);
    default:
      return undefined;
  }
}

function getSegment(path: NodePath, child: NodePath): string | undefined {
  const node = path.node;
  switch (node.type) {
    case "VariableDeclarator":
      return t.isIdentifier(node.id) ? node.id.name : undefined;
    case "FunctionDeclaration":
    case "ClassDeclaration":
    case "ClassExpression":
      return node.id?.name;
    case "FunctionExpression":
      if (node.id) {
        return node.id.name;
      }
      return path.parentPath && getSegment(path.parentPath, path) ? undefined : ANONYMOUS;
    case "ObjectProperty":
      return getKeyName(node.key, node.computed);
    case "ObjectMethod":
    case "ClassMethod":
      return getKeyName(node.key, node.computed ?? false);
    case "ClassPrivateMethod":
      return getKeyName(node.key, false);
    case "ClassProperty":
      // Only the initializer belongs to the property.
      return child.node === node.value ? getKeyName(node.key, node.computed ?? false) : undefined;
    case "ClassPrivateProperty":
      return child.node === node.value ? getKeyName(node.key, false) : undefined;
    case "ExportDefaultDeclaration":
      return "default";
    case "AssignmentExpression":
      return t.isIdentifier(node.left) ? node.left.name : undefined;
    case "ArrowFunctionExpression":
      // An enclosing function that nothing names still has to separate what is
      // inside it from what is beside it.
      return path.parentPath && getSegment(path.parentPath, path) ? undefined : ANONYMOUS;
    default:
      return undefined;
  }
}

function isFunctionBoundary(node: t.Node): boolean {
  switch (node.type) {
    case "ArrowFunctionExpression":
    case "FunctionExpression":
    case "FunctionDeclaration":
    case "ObjectMethod":
    case "ClassMethod":
    case "ClassPrivateMethod":
    case "StaticBlock":
      return true;
    default:
      return false;
  }
}

export function getHierarchicalName(path: NodePath): string {
  const segments: string[] = [];
  let child: NodePath = path;
  let current: NodePath | null = path.parentPath;

  while (current && !t.isProgram(current.node)) {
    // Nothing named this function before another function encloses it, so it
    // is an anonymous function inside that one.
    if (segments.length === 0 && isFunctionBoundary(current.node)) {
      segments.push(ANONYMOUS);
    }
    const segment = getSegment(current, child);
    // A named function expression assigned to a variable of the same name
    // would otherwise repeat itself.
    if (segment && segment !== segments[segments.length - 1]) {
      segments.push(segment);
    }
    child = current;
    current = current.parentPath;
  }

  if (segments.length === 0) {
    return ANONYMOUS;
  }
  return segments.reverse().join(".");
}
