import type * as t from "@babel/types";

type TypeFilter<V extends t.Node> = (node: t.Node) => node is V;

export function isPathValid<V extends t.Node>(
  path: unknown,
  key: TypeFilter<V>,
): path is babel.NodePath<V> {
  const node = (path as babel.NodePath).node;
  return node ? key(node) : false;
}

export type NestedExpression =
  | t.ParenthesizedExpression
  | t.TypeCastExpression
  | t.TSAsExpression
  | t.TSSatisfiesExpression
  | t.TSNonNullExpression
  | t.TSInstantiationExpression
  | t.TSTypeAssertion;

export function isNestedExpression(node: t.Node): node is NestedExpression {
  switch (node.type) {
    case "ParenthesizedExpression":
    case "TypeCastExpression":
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
    case "TSTypeAssertion":
    case "TSInstantiationExpression":
      return true;
    default:
      return false;
  }
}

type TypeCheck<K> = K extends TypeFilter<infer U> ? U : never;

export function unwrapNode<K extends (value: t.Node) => boolean>(
  node: t.Node,
  key: K,
): TypeCheck<K> | undefined {
  if (key(node)) {
    return node as TypeCheck<K>;
  }
  if (isNestedExpression(node)) {
    return unwrapNode(node.expression, key);
  }
  return undefined;
}

export function unwrapPath<V extends t.Node>(
  path: unknown,
  key: TypeFilter<V>,
): babel.NodePath<V> | undefined {
  if (isPathValid(path, key)) {
    return path;
  }
  if (isPathValid(path, isNestedExpression)) {
    return unwrapPath(path.get("expression"), key);
  }
  return undefined;
}
