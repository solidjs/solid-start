import { CodeGenerator } from "@babel/generator";
import crypto from "crypto";

/**
 * @param {{ template: import('@babel/core').template }} param0
 * @returns {import('@babel/core').PluginObj}
 */
export default function routeDataHmrFix({ template }) {
  return {
    visitor: {
      Program(path) {
        const generator = new CodeGenerator(path.node);
        const result = generator.generate();
        const hash = crypto.createHash("sha256").update(result.code).digest("base64");
        const modHash = path.scope.generateUidIdentifier("modHash").name;
        const statements = template.ast(`
        export const ${modHash} = "${hash}";
        if (import.meta.hot) {
          import.meta.hot.accept(newMod => {
            if (${modHash} !== newMod.${modHash}) {
              import.meta.hot.invalidate();
            }
          });
        }
        `);

        path.node.body.push(...(Array.isArray(statements) ? statements : [statements]));
      }
    }
  };
}
