/** @typedef {{ filename: string, done: {}, serverIndex: number; opts: { minify: boolean; root: string; ssr: boolean; } }} State */

/**
 * @returns {import('@babel/core').PluginObj<State>}
 */
export default function transformSetServerIndex() {
  return {
    visitor: {
      Program(_path, state) {
        state.serverIndex = 0;
      },
      CallExpression(path, state) {
        if (path.get("callee").isIdentifier({ name: "server$" })) {
          path.setData("serverIndex", state.serverIndex++);
        }
      }
    }
  };
}
