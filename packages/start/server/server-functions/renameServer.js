import { SERVER_RENAME_PREFIX } from "./constants.js";

export default function transformRenameServer() {
  return {
    visitor: {
      Program: {
        enter(path) {
          let serverIndex = 0;
          path.traverse({
            CallExpression: path => {
              if (path.node.callee.type === "Identifier" && path.node.callee.name === "server") {
                path.node.callee.name = SERVER_RENAME_PREFIX + serverIndex;
                serverIndex++;
              }
            }
          });
        }
      }
    }
  };
}
