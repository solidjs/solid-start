import type * as babel from "@babel/core";
import * as t from "@babel/types";

type HoistableFunction = t.ArrowFunctionExpression | t.FunctionExpression;

/**
 * A server function is moved to the top level of its module. Anything it reads
 * from an enclosing scope stops resolving once it is moved. These checks report
 * that at build time. Without them the code compiles and then fails at runtime,
 * or stops parsing.
 */

function isTypeOnlyPosition(path: babel.NodePath, boundary: babel.NodePath): boolean {
  let current: babel.NodePath | null = path;
  while (current && current !== boundary) {
    if (current.node.type.startsWith("TS") || current.node.type.startsWith("Type")) {
      return true;
    }
    current = current.parentPath;
  }
  return false;
}

/**
 * The nearest ancestor that decides what `this` and `arguments` mean.
 * Arrow functions are transparent. Every other function form is not.
 */
function getThisBoundary(path: babel.NodePath): babel.NodePath | null {
  let previous: babel.NodePath = path;
  let current: babel.NodePath | null = path.parentPath;
  while (current) {
    switch (current.node.type) {
      case "FunctionExpression":
      case "FunctionDeclaration":
      case "ObjectMethod":
      case "ClassMethod":
      case "ClassPrivateMethod":
      case "StaticBlock":
      case "Program":
        return current;
      case "ClassProperty":
      case "ClassPrivateProperty":
        // Only the initializer is bound to the instance.
        if (previous.node === current.node.value) {
          return current;
        }
        break;
      default:
        break;
    }
    previous = current;
    current = current.parentPath;
  }
  return null;
}

function findAncestor(
  path: babel.NodePath,
  boundary: babel.NodePath,
  types: string[],
): babel.NodePath | null {
  let current: babel.NodePath | null = path.parentPath;
  while (current && current !== boundary) {
    if (types.includes(current.node.type)) {
      return current;
    }
    current = current.parentPath;
  }
  return null;
}

export function assertHoistable(path: babel.NodePath<HoistableFunction>, directive: string): void {
  const program = path.scope.getProgramParent().path;
  // A function expression keeps its own `this` and `arguments` wherever it is
  // moved. An arrow takes both from where it is written.
  const isArrow = path.node.type === "ArrowFunctionExpression";
  const boundary = getThisBoundary(path);
  // An arrow written at the top level already reads `this` from the module.
  const lexicalSelfIsModule = boundary === null || boundary.node.type === "Program";

  /**
   * Whether `this` or `arguments` at this position is bound by something that
   * stays behind when the server function moves. A function expression keeps
   * both wherever it lands, and a nested function binds its own.
   */
  function isLexicallyOutside(child: babel.NodePath): boolean {
    const binder = getThisBoundary(child);
    if (binder && binder !== path && binder.isDescendant(path)) {
      return false;
    }
    if (binder === path && !isArrow) {
      return false;
    }
    return !lexicalSelfIsModule;
  }

  function unsupported(target: babel.NodePath, what: string, hint: string): never {
    throw target.buildCodeFrameError(
      `${what} cannot be used inside a "${directive}" function, because the function is moved to the top level of the module. ${hint}`,
    );
  }

  // `super` and private members are reported first. When both apply to the same
  // expression, such as `this.#value`, they are the more specific cause.
  path.traverse({
    Super(child) {
      const home = findAncestor(child, path, ["ObjectMethod", "ClassMethod", "ClassPrivateMethod"]);
      if (!home) {
        unsupported(
          child,
          "`super`",
          "Move the server function out of the method and pass what it needs as an argument.",
        );
      }
    },
    PrivateName(child) {
      const owner = findAncestor(child, path, ["ClassBody"]);
      if (!owner) {
        unsupported(
          child,
          "A private class member",
          "Read it outside the server function and pass it as an argument.",
        );
      }
    },
  });

  path.traverse({
    ThisExpression(child) {
      if (!isLexicallyOutside(child)) {
        return;
      }
      unsupported(child, "`this`", "Pass the value it refers to as an argument instead.");
    },
    Identifier(child) {
      if (!child.isReferencedIdentifier() || isTypeOnlyPosition(child, path)) {
        return;
      }
      const { name } = child.node;

      if (name === "arguments") {
        if (!isLexicallyOutside(child)) {
          return;
        }
        unsupported(
          child,
          "`arguments`",
          "Declare the parameters the server function needs instead.",
        );
      }

      const binding = child.scope.getBinding(name);
      // No binding means a global, which is still a global after the move.
      if (!binding) {
        return;
      }
      // Declared by the function itself, so it moves along with it.
      if (binding.path === path || binding.path.isDescendant(path)) {
        return;
      }
      // Declared at the top level of the module, where the function lands.
      if (binding.scope.path === program) {
        return;
      }
      throw child.buildCodeFrameError(
        `"${name}" is declared outside the "${directive}" function that uses it, and the function is moved to the top level of the module, so "${name}" is not in scope when it runs. Pass it as an argument instead.`,
      );
    },
  });
}

/**
 * A directive only applies to a function body. The transform ignores one in a
 * method, which ships the method body and every module it imports to the
 * browser.
 */
export function assertNoMethodDirectives(
  program: babel.NodePath<t.Program>,
  directive: string,
): void {
  function check(
    child: babel.NodePath<t.ObjectMethod | t.ClassMethod | t.ClassPrivateMethod>,
  ): void {
    for (const current of child.node.body.directives) {
      if (current.value.value === directive) {
        throw child.buildCodeFrameError(
          `"${directive}" is not supported in a method. Move the body into a function and call it from the method:\n` +
            `  const handler = async () => { "${directive}"; /* ... */ };`,
        );
      }
    }
  }
  program.traverse({
    ObjectMethod: check,
    ClassMethod: check,
    ClassPrivateMethod: check,
  });
}

/**
 * A directive string that is not in a directive prologue does nothing. It is
 * almost always meant to be one, so report it. Otherwise the module compiles as
 * if it had no server functions.
 */
export function collectMisplacedDirectives(
  program: babel.NodePath<t.Program>,
  directive: string,
): string[] {
  const warnings: string[] = [];
  program.traverse({
    ExpressionStatement(child) {
      const expression = child.node.expression;
      if (!t.isStringLiteral(expression) || expression.value !== directive) {
        return;
      }
      const line = child.node.loc?.start.line;
      warnings.push(
        `"${directive}" on line ${line ?? "?"} is ignored because it is not the first statement of a function body or of the module. ` +
          `Move it to the top of the body, before any other statement.`,
      );
    },
  });
  return warnings;
}
