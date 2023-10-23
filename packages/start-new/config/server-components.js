import {
  decorateExportsPlugin,
  directives,
  shimExportsPlugin,
  wrapExportsPlugin
} from "@vinxi/plugin-directives";
import { clientComponents } from "@vinxi/plugin-references/client-components";
import { SERVER_REFERENCES_MANIFEST, hash } from "@vinxi/plugin-references/constants";
import { buildServerComponents } from "@vinxi/plugin-references/server-components";
import { fileURLToPath } from "node:url";

function client() {
  return clientComponents({
    server: "ssr",
    transpileDeps: [],
    manifest: SERVER_REFERENCES_MANIFEST
  });
}

function server() {
  const runtime = fileURLToPath(new URL("./server-runtime.jsx", import.meta.url));
  // export function serverComponents({
  // 	resolve = {
  // 		conditions: ["react-server"],
  // 	},
  // 	runtime = "@vinxi/react-server-dom-vite/runtime",
  // 	transpileDeps = ["react", "react-dom", "@vinxi/react-server-dom-vite"],
  // 	manifest = SERVER_REFERENCES_MANIFEST,
  // 	transforms = undefined,
  // } = {}) {
  const serverModules = new Set();
  const clientModules = new Set();

  function onReference(type, reference) {
    if (type === "server") {
      serverModules.add(reference);
    } else {
      clientModules.add(reference);
    }
  }

  return [
    directives({
      hash: e => `c_${hash(e)}`,
      runtime,
      onReference: onReference,
      transforms: [
        shimExportsPlugin({
          runtime: {
            module: runtime,
            function: "createServerReference"
          },
          onModuleFound: mod => onReference("server", mod),
          hash: e => `c_${hash(e)}`,
          apply: (code, id, options) => {
            return !options.ssr;
          },
          pragma: "use server"
        }),
        decorateExportsPlugin({
          runtime: {
            module: runtime,
            function: "createServerReference"
          },
          onModuleFound: mod => onReference("server", mod),
          hash: e => `c_${hash(e)}`,
          apply: (code, id, options) => {
            return options.ssr;
          },
          pragma: "use server"
        }),
        wrapExportsPlugin({
          runtime: {
            module: runtime,
            function: "createClientReference"
          },
          onModuleFound: mod => onReference("client", mod),
          hash: e => `c_${hash(e)}`,
          apply: (code, id, options) => {
            return options.ssr;
          },
          pragma: "use client"
        })
      ]
    }),
    buildServerComponents({
      resolve: {
        conditions: []
      },
      transpileDeps: [],
      manifest: SERVER_REFERENCES_MANIFEST,
      modules: {
        server: serverModules,
        client: clientModules
      }
    })
  ];
  // }
}

export const serverComponents = {
  client,
  server
};
