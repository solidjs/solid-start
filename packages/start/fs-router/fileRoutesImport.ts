import type * as BabelTypes from "@babel/types/lib";

type Path = {
  node: { body: any; source: { value: string; }; specifiers: any[]; };
  scope: { generateUidIdentifier: (arg0: string) => any; };
  replaceWith: (arg0: any) => void;
  insertBefore: (arg0: any) => void;
}

type State = {
  namespaceSpec: any[];
}

export default function fileRoutesImport({ types: t }: { types: typeof BabelTypes }) {
  return {
    visitor: {
      ImportDeclaration(path: Path, state: State) {
        if (path.node.source.value !== "solid-start") {
          return;
        }

        const specifiers = path.node.specifiers;
        for (let i = specifiers.length - 1; i >= 0; i--) {
          const specifier = specifiers[i];
          if (specifier.type === "ImportNamespaceSpecifier") {
            state.namespaceSpec.push(specifier);
          } else if (
            specifier.type === "ImportSpecifier" &&
            specifier.imported.name === "FileRoutes"
          ) {
            specifiers.splice(i, 1);
            const newImport = t.importDeclaration(
              [t.importDefaultSpecifier(specifier.local)],
              t.stringLiteral("solid-start/root/FileRoutes")
            );
            if (path.node.specifiers.length === 0) {
              path.replaceWith(newImport);
            } else {
              path.insertBefore(newImport);
            }
          }
        }
      },
      Program: {
        enter(_path: Path, state: State) {
          state.namespaceSpec = [];
        },
        exit(path: Path, state: State) {
          const body = path.node.body;
          let lastImportIndex: number;
          if (state.namespaceSpec.length) {
            for (let i = 0; i < body.length; i++) {
              if (body[i].type === "ImportDeclaration") {
                lastImportIndex = i;
              }
            }
          }
          for (const specifier of state.namespaceSpec) {
            const fileRoutesId = path.scope.generateUidIdentifier("FileRoutes");
            const newImport = t.importDeclaration(
              [t.importDefaultSpecifier(fileRoutesId)],
              t.stringLiteral("solid-start/root/FileRoutes")
            );
            body.unshift(newImport);
            lastImportIndex!++;
            const namespaceId = path.scope.generateUidIdentifier(specifier.local.name);
            const namespaceFix = t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier(specifier.local.name),
                t.objectExpression([
                  t.spreadElement(namespaceId),
                  t.objectProperty(t.identifier("FileRoutes"), fileRoutesId)
                ])
              )
            ]);
            body.splice(lastImportIndex! + 1, 0, namespaceFix);
            specifier.local.name = namespaceId.name;
          }
        }
      }
    }
  };
}
