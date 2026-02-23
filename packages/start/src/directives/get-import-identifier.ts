import type * as babel from "@babel/core";
import * as t from "@babel/types";
import { generateUniqueName } from "./generate-unique-name.ts";
import type { ImportDefinition } from "./types.ts";

export function getImportIdentifier(
  imports: Map<string, t.Identifier>,
  path: babel.NodePath,
  registration: ImportDefinition,
): t.Identifier {
  const name = registration.kind === "named" ? registration.name : "default";
  const target = `${registration.source}[${name}]`;
  const current = imports.get(target);
  if (current) {
    return current;
  }
  const programParent = path.scope.getProgramParent();
  const uid = generateUniqueName(programParent.path, name);
  programParent.registerDeclaration(
    (programParent.path as babel.NodePath<t.Program>).unshiftContainer(
      "body",
      t.importDeclaration(
        [
          registration.kind === "named"
            ? t.importSpecifier(uid, t.identifier(registration.name))
            : t.importDefaultSpecifier(uid),
        ],
        t.stringLiteral(registration.source),
      ),
    )[0],
  );
  imports.set(target, uid);
  return uid;
}
