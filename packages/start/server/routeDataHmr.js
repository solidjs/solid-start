// @ts-nocheck
import generate from "@babel/generator";
import template from "@babel/template";
import crypto from "crypto";

export default function routeDataHmr() {
  return {
    visitor: {
      Program(path) {
        const result = generate.default(path.node);
        const hash = crypto.createHash("sha256").update(result.code).digest("base64");
        const modHash = path.scope.generateUidIdentifier("modHash").name;
        const statements = template.default.ast(`
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
