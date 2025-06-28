import { join } from "pathe";
import clientProdManifest from "solid-start:client-prod-manifest";

const clientManifest = new Proxy(
  {},
  {
    get(target, routerName) {
      // invariant(typeof routerName === "string", "Bundler name should be a string");
      return {
        // name: routerName,
        // type: import.meta.env.ROUTER_TYPE,
        // handler: import.meta.env.DEV
        //   ? join(import.meta.env.CWD, import.meta.env.ROUTER_HANDLER)
        //   : // @ts-ignore
        //     virtualId(handlerModule({ name: routerName })),
        // baseURL: import.meta.env.BASE_URL,
        // chunks: new Proxy(
        //   {},
        //   {
        //     get(target, chunk) {
        //       invariant(typeof chunk === "string", "Chunk expected");
        //       let outputPath = import.meta.env.DEV
        //         ? join(import.meta.env.BASE_URL, "@fs", chunk)
        //         : join(import.meta.env.BASE_URL, chunk + ".mjs");
        //       return {
        //         import() {
        //           return import(/* @vite-ignore */ outputPath);
        //         },
        //         output: {
        //           path: outputPath
        //         }
        //       };
        //     }
        //   }
        // ),
        inputs: new Proxy(
          {},
          {
            get(target, input: string) {
              // invariant(typeof input === "string", "Input must be string");

              let outputPath = import.meta.env.DEV
                ? join("/", input)
                : clientProdManifest[input]!.output;
              return {
                async import() {
                  return import(/* @vite-ignore */ outputPath);
                },
                // async assets() {
                //   if (import.meta.env.DEV) {
                //     const assetsPath =
                //       join(
                //         import.meta.env.BASE_URL,
                //         `@manifest/${routerName}/${Date.now()}/assets`
                //       ) + `?id=${input}`;
                //     return (await import(/* @vite-ignore */ assetsPath)).default;
                //   } else {
                //     return window.manifest[input].assets;
                //   }
                // },
                output: {
                  path: outputPath
                }
              };
            }
          }
        )
      };
    }
  }
);

export default clientManifest;

(globalThis as any).MANIFEST = clientManifest;
