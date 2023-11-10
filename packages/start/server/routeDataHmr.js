// @ts-nocheck
import _generate from "@babel/generator";
import _template from "@babel/template";
import crypto from "crypto";

/**
 * NOTE: @babel/generator and @babel/template have not
 * publish esm vision.
 * detail: https://github.com/babel/babel/issues/15269#issue-1494499461
 *
 */
const generate = typeof _generate.default == 'function' ? _generate.default : _generate
const template = typeof _template.default == 'function' ? _template.default : _template

export default function routeDataHmr() {
  return {
    visitor: {
      Program(path) {
        const result = generate(path.node);
        const hash = crypto.createHash("sha256").update(result.code).digest("base64");
        const modHash = path.scope.generateUidIdentifier("modHash").name;
        const statements = template.ast(`
        export const ${modHash} = "${hash}";
        if (import.meta.hot) {
          import.meta.hot.data.modHash = ${modHash};
          import.meta.hot.accept(newMod => {
            import.meta.hot.data.modHash = ${modHash};
            if (import.meta.hot.data.modHash !== newMod.${modHash}) {
              import.meta.hot.invalidate();
            }
          });
        }
        `);

        path.node.body.push(...statements);
      }
    }
  };
}
