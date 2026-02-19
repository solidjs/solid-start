import type * as babel from "@babel/core";
import * as t from "@babel/types";

export function bubbleFunctionDeclaration(path: babel.NodePath<t.FunctionDeclaration>): void {
  const decl = path.node;
  // Check if declaration is FunctionDeclaration
  if (decl.id) {
    const block = (path.findParent(current => current.isBlockStatement()) ||
      path.scope.getProgramParent().path) as babel.NodePath<t.BlockStatement>;

    const [tmp] = block.unshiftContainer(
      "body",
      t.variableDeclaration("const", [
        t.variableDeclarator(
          decl.id,
          t.functionExpression(decl.id, decl.params, decl.body, decl.generator, decl.async),
        ),
      ]),
    );
    path.scope.registerDeclaration(tmp);
    tmp.skip();
    if (path.parentPath.isExportNamedDeclaration()) {
      path.parentPath.replaceWith(
        t.exportNamedDeclaration(undefined, [t.exportSpecifier(decl.id, decl.id)]),
      );
    } else if (path.parentPath.isExportDefaultDeclaration()) {
      path.replaceWith(decl.id);
    } else {
      path.remove();
    }
  }
}
