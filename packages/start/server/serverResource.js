function transformRouteData({ types: t }) {
  return {
    visitor: {
      Program: {
        enter(path, state) {
          state.refs = new Set();
          state.resourceRequired = false;
          state.actionRequired = false;
          state.serverImported = false;
          state.routeDataImported = false;
          state.routeActionImported = false;
          path.traverse(
            {
              ImportSpecifier(path) {
                if (path.node.imported.name === "createRouteData") {
                  state.routeDataImported = true;
                }
                if (path.node.imported.name === "createRouteAction") {
                  state.routeActionImported = true;
                }
              },
              ImportDeclaration(path) {
                if (path.node.source.value === "solid-start/server") {
                  if (path.node.specifiers.some(v => t.isImportDefaultSpecifier(v)))
                    state.serverImported = true;
                }
              },
              CallExpression(callPath, callState) {
                if (callPath.get("callee").isIdentifier({ name: "createServerData" })) {
                  let args = callPath.node.arguments;

                  // need to handle more cases assumes inline options object
                  if (args.length === 1 || t.isObjectExpression(args[1])) {
                    args[0] = t.callExpression(t.identifier("server"), [args[0]]);
                  } else args[1] = t.callExpression(t.identifier("server"), [args[1]]);
                  callPath.replaceWith(
                    t.callExpression(t.identifier("createRouteData"), callPath.node.arguments)
                  );
                  callState.resourceRequired = true;
                }

                if (callPath.get("callee").isIdentifier({ name: "createServerAction" })) {
                  let args = callPath.node.arguments;

                  args[0] = t.callExpression(t.identifier("server"), [args[0]]);
                  callPath.replaceWith(
                    t.callExpression(t.identifier("createRouteAction"), callPath.node.arguments)
                  );
                  callState.actionRequired = true;
                }
              }
            },
            state
          );

          if ((state.resourceRequired || state.actionRequired) && !state.serverImported) {
            path.unshiftContainer(
              "body",
              t.importDeclaration(
                [t.importDefaultSpecifier(t.identifier("server"))],
                t.stringLiteral("solid-start/server")
              )
            );
          }

          if (state.resourceRequired && !state.routeDataImported) {
            path.unshiftContainer(
              "body",
              t.importDeclaration(
                [
                  t.importSpecifier(
                    t.identifier("createRouteData"),
                    t.identifier("createRouteData")
                  )
                ],
                t.stringLiteral("solid-start/data")
              )
            );
          }

          if (state.actionRequired && !state.routeActionImported) {
            path.unshiftContainer(
              "body",
              t.importDeclaration(
                [
                  t.importSpecifier(
                    t.identifier("createRouteAction"),
                    t.identifier("createRouteAction")
                  )
                ],
                t.stringLiteral("solid-start/data")
              )
            );
          }
        }
      }
    }
  };
}
export { transformRouteData as default };
