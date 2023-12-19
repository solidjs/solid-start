import { nodeTypes } from "@mdx-js/mdx";
import { parse } from "acorn";
import Slugger from "github-slugger";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkShikiTwoslash from "remark-shiki-twoslash";
import { visit } from "unist-util-visit";
import pkg from "@vinxi/plugin-mdx";
const { default: mdx } = pkg;
import { name as isValidIdentifierName } from "estree-util-is-identifier-name";
import { valueToEstree } from "estree-util-value-to-estree";
import { parse as parseYaml } from "yaml";

/**
 * Create an MDX ESM export AST node from an object.
 *
 * Each key of the object will be used as the export name.
 *
 * @param object The object to create an export node for.
 * @returns The MDX ESM node.
 */
function createExport(object) {
  return {
    type: "mdxjsEsm",
    value: "",
    data: {
      estree: {
        type: "Program",
        sourceType: "module",
        body: [
          {
            type: "ExportNamedDeclaration",
            specifiers: [],
            declaration: {
              type: "VariableDeclaration",
              kind: "const",
              declarations: Object.entries(object).map(([identifier, val]) => {
                if (!isValidIdentifierName(identifier)) {
                  throw new Error(
                    `Frontmatter keys should be valid identifiers, got: ${JSON.stringify(
                      identifier
                    )}`
                  );
                }
                return {
                  type: "VariableDeclarator",
                  id: { type: "Identifier", name: identifier },
                  init: valueToEstree(val)
                };
              })
            }
          }
        ]
      }
    }
  };
}

function jsToTreeNode(jsString, acornOpts) {
  return {
    type: "mdxjsEsm",
    value: "",
    data: {
      estree: {
        body: [],
        ...parse(
          jsString,
          acornOpts ?? {
            sourceType: "module",
            ecmaVersion: 2020
          }
        ),
        type: "Program",
        sourceType: "module"
      }
    }
  };
}

export function docsMdx() {
  const cache = new Map();
  const headingsCache = new Map();
  const frontMatterCache = new Map();

  /**
   * A remark plugin to expose frontmatter data as named exports.
   *
   * @param options Optional options to configure the output.
   * @returns A unified transformer.
   */
  const remarkMdxFrontmatter = ({ name, parsers } = {}) => {
    const allParsers = {
      yaml: parseYaml,
      ...parsers
    };

    return (ast, file) => {
      const imports = [];

      if (name && !isValidIdentifierName(name)) {
        throw new Error(
          `If name is specified, this should be a valid identifier name, got: ${JSON.stringify(
            name
          )}`
        );
      }

      for (const node of ast.children) {
        if (!Object.hasOwnProperty.call(allParsers, node.type)) {
          continue;
        }

        const parser = allParsers[node.type];

        const { value } = node;
        const data = parser(value);
        if (data == null) {
          continue;
        }
        if (!name && typeof data !== "object") {
          throw new Error(`Expected frontmatter data to be an object, got:\n${value}`);
        }

        frontMatterCache.set(file.path, data);

        imports.push(createExport(name ? { [name]: data } : data));
      }

      if (name && !imports.length) {
        imports.push(createExport({ [name]: undefined }));
      }

      ast.children.unshift(...imports);
    };
  };

  function rehypeCollectHeadings() {
    const slugger = new Slugger();
    return function (tree, file) {
      const headings = [];
      visit(tree, node => {
        if (node.type !== "element") return;
        const { tagName } = node;
        if (tagName[0] !== "h") return;
        const [_, level] = tagName.match(/h([0-6])/) ?? [];
        if (!level) return;
        const depth = Number.parseInt(level);

        let text = "";
        visit(node, (child, __, parent) => {
          if (child.type === "element" || parent == null) {
            return;
          }
          if (child.type === "raw" && child.value.match(/^\n?<.*>\n?$/)) {
            return;
          }
          if (new Set(["text", "raw", "mdxTextExpression"]).has(child.type)) {
            text += child.value;
          }
        });

        node.properties = node.properties || {};
        if (typeof node.properties.id !== "string") {
          let slug = slugger.slug(text);
          if (slug.endsWith("-")) {
            slug = slug.slice(0, -1);
          }
          node.properties.id = slug;
        }
        headings.push({ depth, slug: node.properties.id, text });
      });

      headingsCache.set(file.path, headings);
      tree.children.unshift(
        jsToTreeNode(`export function getHeadings() { return ${JSON.stringify(headings)} }`)
      );
    };
  }

  let plugin = {
    ...mdx.withImports({})({
      jsx: true,
      jsxImportSource: "solid-js",
      providerImportSource: "solid-mdx",
      rehypePlugins: [rehypeSlug, rehypeCollectHeadings, [rehypeRaw, { passThrough: nodeTypes }]],
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        [
          remarkShikiTwoslash.default,
          {
            disableImplicitReactImport: true,
            includeJSDocInHover: true,
            // theme: "css-variables",
            themes: ["github-dark", "github-light"],
            defaultCompilerOptions: {
              allowSyntheticDefaultImports: true,
              esModuleInterop: true,
              target: "ESNext",
              module: "esnext",
              lib: ["lib.dom.d.ts", "lib.es2015.d.ts"],
              jsxImportSource: "solid-js",
              jsx: "preserve",
              types: ["solid-start/env"],
              paths: {
                "~/*": ["./src/*"]
              }
            }
          }
        ]
      ]
    }),
    enforce: "pre"
  };
  return [
    // {
    //   ...plugin,
    //   async transform(code, url) {
    //     const [id, query] = url.split("?");
    //     console.log(id);
    //     if (id.endsWith(".mdx") || id.endsWith(".md")) {
    //       if (cache.has(code)) {
    //         return cache.get(code);
    //       }

    //       let result = await plugin.transform?.call(this, code, id);
    //       cache.set(code, result);

    //       console.log(result);

    //       return result;
    //     }
    //   }
    // },
    mdx.withImports({})({
      jsx: true,
      jsxImportSource: "solid-js",
      providerImportSource: "solid-mdx",
      rehypePlugins: [rehypeSlug, rehypeCollectHeadings, [rehypeRaw, { passThrough: nodeTypes }]],
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        [
          remarkShikiTwoslash.default,
          {
            disableImplicitReactImport: true,
            includeJSDocInHover: true,
            // theme: "css-variables",
            themes: ["github-dark", "github-light"],
            defaultCompilerOptions: {
              allowSyntheticDefaultImports: true,
              esModuleInterop: true,
              target: "ESNext",
              module: "esnext",
              lib: ["lib.dom.d.ts", "lib.es2015.d.ts"],
              jsxImportSource: "solid-js",
              jsx: "preserve",
              types: ["solid-start/env"],
              paths: {
                "~/*": ["./src/*"]
              }
            }
          }
        ]
      ]
    })
    // {
    //   ...plugin,
    //   name: "mdx-meta",
    //   async transform(code, id) {
    //     if (id.endsWith(".mdx?meta") || id.endsWith(".md?meta")) {
    //       id = id.replace(/\?meta$/, "");

    //       function getCode() {
    //         return `
    //           export function getHeadings() { return ${JSON.stringify(
    //             headingsCache.get(id),
    //             null,
    //             2
    //           )}

    //           }
    //           export function getFrontMatter() {
    //             return ${JSON.stringify(frontMatterCache.get(id), null, 2)}
    //           }`;
    //       }

    //       if (cache.has(code)) {
    //         return { code: getCode() };
    //       }

    //       let result = await plugin.transform?.call(this, code, id);

    //       cache.set(code, result);

    //       return {
    //         code: getCode()
    //       };
    //     }
    //   }
    // },

    // {
    //   name: "twoslash-fix-lsp-linebreaks",
    //   transform: (code, id) => {
    //     if (
    //       id.endsWith(".md") ||
    //       id.endsWith(".mdx") ||
    //       id.endsWith(".mdx?meta") ||
    //       id.endsWith(".md?meta")
    //     ) {
    //       return {
    //         code: code
    //           .replace(/lsp="([^"]*)"/g, (match, p1) => {
    //             return `lsp={\`${p1.replaceAll("`", `\\\``)}\`}`;
    //           })
    //           .replace(/{"\\n"}/g, "")
    //       };
    //     }
    //   },
    //   enforce: "pre"
    // }
  ];
}

// export function docsMdx() {
//   return mdx();
// }
