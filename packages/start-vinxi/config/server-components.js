import {
  decorateExportsPlugin,
  directives,
  shimExportsPlugin,
  wrapExportsPlugin
} from "@vinxi/plugin-directives";
import { client as clientComponents } from "@vinxi/server-components/client";
import { SERVER_REFERENCES_MANIFEST } from "@vinxi/server-components/constants";
import { buildServerComponents } from "@vinxi/server-components/server";
import { fileURLToPath } from "node:url";
import { chunkify } from "vinxi/lib/chunks";
import { normalize } from "vinxi/lib/path";

function client() {
  return clientComponents({
    server: "ssr",
    transpileDeps: [],
    manifest: SERVER_REFERENCES_MANIFEST
  });
}

function server() {
  const runtime = normalize(fileURLToPath(new URL("../dist/runtime/server-runtime.js", import.meta.url)));
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
      hash: chunkify,
      runtime,
      onReference: onReference,
      transforms: [
        shimExportsPlugin({
          runtime: {
            module: runtime,
            function: "createServerReference"
          },
          onModuleFound: mod => onReference("server", mod),
          hash: chunkify,
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
          hash: chunkify,
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
          hash: chunkify,
          apply: (code, id, options) => {
            return options.ssr;
          },
          pragma: "use client"
        })
      ]
    }),
    buildServerComponents({
      resolve: {
        conditions: ["solid"]
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
