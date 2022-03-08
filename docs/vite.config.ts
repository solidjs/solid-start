import { defineConfig } from "vite";
import solid from "solid-start";
import mdx from "@mdx-js/rollup";
import WindiCSS from "vite-plugin-windicss";
import rehypeRaw from "rehype-raw";
// @ts-ignore
import { nodeTypes } from "@mdx-js/mdx";
// @ts-ignore
import remarkShikiTwoslash from "remark-shiki-twoslash";
export default defineConfig({
  plugins: [
    {
      ...mdx({
        jsx: true,
        jsxImportSource: "solid-js",
        providerImportSource: "solid-mdx",
        rehypePlugins: [[rehypeRaw, { passThrough: nodeTypes }]],
        remarkPlugins: [
          [
            // @ts-ignore
            remarkShikiTwoslash.default,
            {
              disableImplicitReactImport: true,
              includeJSDocInHover: true,
              theme: "light-plus",
              defaultCompilerOptions: {
                allowSyntheticDefaultImports: true,
                esModuleInterop: true,
                target: "ESNext",
                lib: ["DOM", "ES2015"],
                module: "ESNext",
                jsxImportSource: "solid-js",
                jsx: "preserve",
                types: ["vite/client"],
                paths: {
                  "~/*": ["./src/*"]
                }
              }
            }
          ]
        ]
      }),
      enforce: "pre"
    },
    {
      name: "twoslash-fix-lsp-linebreaks",
      transform: (code, id) => {
        if (id.endsWith(".md") || id.endsWith(".mdx")) {
          return {
            code: code.replace(/lsp="([^"]*)"/g, (match, p1) => {
              return `lsp={\`${p1.replaceAll("`", `\\\``)}\`}`;
            })
          };
        }
        return { code };
      },
      enforce: "pre"
    },
    WindiCSS({
      config: {
        theme: {
          extend: {
            fontFamily: {
              sans: ["DM Sans", "Inter var", "sans-serif"]
            }
          }
        }
      }
    }),
    solid({
      extensions: [".mdx", ".md"]
    })
  ]
});
