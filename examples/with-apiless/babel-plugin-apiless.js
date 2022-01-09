import fsPath from "path";
import fs from "fs";

export default function (babel) {
  const { types: t } = babel;

  return {
    name: "ast-transform", // not required
    visitor: {
      ImportDeclaration(path, state) {
        let importPath = path.get("source").get("value").node;
        if (importPath.endsWith(".api") && path.importKind !== "type") {
          let statements = [babel.template`import { createClientResolver } from '~/api';`()];
          let specifiers = path.get("specifiers");
          for (var i = 0; i < specifiers.length; i++) {
            let specifier = specifiers[i];
            let apiDir = fsPath.dirname(state.file.opts.filename);
            let apiPath;
            for (var ext of ["js", "ts", "tsx", "jsx"]) {
              if (fs.existsSync(fsPath.join(apiDir, importPath + "." + ext))) {
                apiPath = fsPath
                  .join(apiDir, importPath.replace(".api", ""))
                  .replace(process.cwd(), "");
              }
            }
            statements.push(
              babel.template`
              const ${specifier.node.local.name} = createClientResolver(
                  '${
                    "/__api" +
                    (importPath.startsWith(".")
                      ? apiPath
                      : importPath.startsWith("/")
                      ? importPath.replace(".api", "")
                      : `/${importPath.replace(".api", "")}`)
                  }', 
                  ${
                    specifier.type === "ImportDefaultSpecifier"
                      ? `'default'`
                      : `'${specifier.node.local.name}'`
                  })`()
            );
            // statements.push(
            //   babel.template`
            //   ${specifier.node.local.name}.warm()`()
            // );
          }
          path.replaceWithMultiple(statements);
        }
      }
    }
  };
}
