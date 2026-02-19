import type * as babel from "@babel/core";
import type * as t from "@babel/types";

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
                binding.path.remove();
                dirty = true;
              }
              break;
            case "local":
            case "param":
            case "unknown":
              break;
          }
        }
      },
    });
    program.scope.crawl();
  }
}
