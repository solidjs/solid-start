import { parse } from "es-module-lexer";
import esbuild from "esbuild";
import { dirname, join, relative } from "path";
import { normalizePath } from "vite";

/** @return {import('vite').Plugin} */
export function islands() {
  /** @type {import('vite').ConfigEnv} */
  let mode;
  return {
    enforce: "pre",
    name: "solid-start-islands",
    config(c, m) {
      mode = m;
    },
    load(id) {
      if (id.includes("?island")) {
        let f = id.match(/isle_([A-Z0-9a-z_]+)&?\??$/);
        if (!f) {
          return {
            code: `
            import Component from '${id.replace("?island", "?client")}';

            window._$HY.island("${
              mode.command === "serve"
                ? `/@fs/${id}`
                : `${normalizePath(relative(process.cwd(), id))}`
            }", Component);

            export default Component;
            `
          };
        } else {
          return {
            code: `
            export { ${f[1]} } from '${id.replace(/\?.*/, "?client")}';
            import { ${f[1]} } from '${id.replace(/\?.*/, "?client")}';

            window._$HY.island("${
              mode.command === "serve" ? `/@fs/${id}` : `${relative(process.cwd(), id)}`
            }",  ${f[1]});

            `
          };
        }
      }
    },
    /**
     * @param {any} id
     * @param {string} code
     */
    transform(code, id, ssr) {
      if (code.startsWith('"use client"') && !id.includes("?client")) {
        let [imports, exports] = parse(
          esbuild.transformSync(code, {
            jsx: "transform",
            format: "esm",
            loader: "tsx"
          }).code
        );

        let prep = `
        import { island } from 'solid-start/islands';

        `;

        let client = `
        import { island } from 'solid-start/islands';
        `;

        exports.map(e => {
          if (e.n === "default") {
            prep += `
            import component from '${id}?client';
            export default island(component, "${
              mode.command === "serve"
                ? `/@fs/` + id + "?island"
                : `${normalizePath(relative(process.cwd(), id))}?island`
            }");`;
            client += `
            import Island from '${id}?island';
            export default island(Island, "${
              mode.command === "serve"
                ? `/@fs/` + id + "?island"
                : `${normalizePath(relative(process.cwd(), id))}?island`
            }");`;
          } else {
            if (e.n.charAt(0).match(/^[A-Z].*/)) {
              prep += `
              import {${e.ln} as ${e.ln}Island } from '${id}?client';
              export const ${e.ln} = island(${e.ln}Island, "${
                mode.command === "serve"
                  ? `/@fs/` + id + `?island&isle_${e.ln}`
                  : `${normalizePath(relative(process.cwd(), id))}?island&isle_${e.ln}`
              }");`;
              client += `
              import { ${e.ln} as ${e.ln}Island } from '${id}?island&isle_${e.ln}';
              export const ${e.ln} = island(${e.ln}Island, "${
                mode.command === "serve"
                  ? `/@fs/` + id + `?island&isle_${e.ln}`
                  : `${normalizePath(relative(process.cwd(), id))}?island&isle_${e.ln}`
              }");`;
            } else {
              prep += `
              export {${e.ln} } from '${id}?client';`;
              client += `
              export { ${e.ln} } from '${id}?client';
              `;
            }
          }
        });
        return {
          code: ssr ? prep : client
        };
      }
      if (code.includes("unstable_island")) {
        let replaced = code.replaceAll(
          /const ([A-Za-z_]+) = unstable_island\(\(\) => import\("([^"]+)"\)\)/g,
          (a, b, c) =>
            ssr
              ? `import ${b}_island from "${c}?client";
                  const ${b} = unstable_island(${b}_island, "${
                  mode.command === "serve"
                    ? `/@fs/${normalizePath(join(dirname(id), c))}` + ".tsx" + "?island"
                    : `${normalizePath(
                        relative(process.cwd(), normalizePath(join(dirname(id), c)))
                      )}.tsx?island`
                }");`
              : `const ${b} = unstable_island(() => import("${c}?island"), "${
                  `/@fs/${normalizePath(join(dirname(id), c)).slice(1)}` + ".tsx" + "?island"
                }")`
        );

        return replaced;
      }
    }
  };
}
