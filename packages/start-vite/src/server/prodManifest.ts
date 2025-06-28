import { join } from "node:path";
import { pathToFileURL } from "node:url";

// export function createProdManifest() {
//   const app = (globalThis as any).app;
//   const manifest = new Proxy(
//     {},
//     {
//       get(target, routerName) {
//         // invariant(typeof routerName === "string", "Bundler name expected");
//         const bundlerManifest = app.buildManifest[routerName];
//         // invariant(router.type !== "static", "manifest not available for static router");
//         return {
//           handler: app.handlers[routerName],
//           async assets() {
//             const assets: Record<string, string[]> = {};
//             assets[router.handler] = await this.inputs[router.handler].assets();
//             for (const route of (await router.internals.routes?.getRoutes()) ?? []) {
//               assets[route.filePath] = await this.inputs[route.filePath].assets();
//             }
//             return assets;
//           },
//           async routes() {
//             return (await router.internals.routes?.getRoutes()) ?? [];
//           },
//           async json() {
//             const json: Record<string, { output: string; assets: string[] }> = {};
//             for (const input of Object.keys(this.inputs)) {
//               json[input] = {
//                 output: this.inputs[input].output.path,
//                 assets: await this.inputs[input].assets()
//               };
//             }
//             return json;
//           },
//           chunks: new Proxy(
//             {},
//             {
//               get(target, chunk: string) {
//                 // invariant(typeof chunk === "string", "Chunk expected");
//                 const chunkPath = join(router.outDir, router.base, chunk + ".mjs");
//                 return {
//                   import() {
//                     if ((globalThis as any).$$chunks[chunk + ".mjs"]) {
//                       return (globalThis as any).$$chunks[chunk + ".mjs"];
//                     }
//                     return import(pathToFileURL(chunkPath).href);
//                   },
//                   output: {
//                     path: chunkPath
//                   }
//                 };
//               }
//             }
//           ),
//           inputs: new Proxy(
//             {},
//             {
//               ownKeys(target) {
//                 const keys = Object.keys(bundlerManifest)
//                   .filter(id => bundlerManifest[id].isEntry)
//                   .map(id => id);
//                 return keys;
//               },
//               getOwnPropertyDescriptor(k) {
//                 return {
//                   enumerable: true,
//                   configurable: true
//                 };
//               },
//               get(target, input) {
//                 // invariant(typeof input === "string", "Input expected");
//                 const id = input;
//                 if (routerName === "server") {
//                   // const id = input === router.handler ? virtualId(handlerModule(router)) : input;
//                   return {
//                     assets() {
//                       return [];
//                       // return createHtmlTagsForAssets(
//                       //   router,
//                       //   app,
//                       //   findAssetsInViteManifest(bundlerManifest, id)
//                       // );
//                     },
//                     output: {
//                       path: join(router.outDir, router.base /* , bundlerManifest[id].file */)
//                     }
//                   };
//                 } else if (routerName === "client") {
//                   const id = input.replace("./", "");
//                   return {
//                     import() {
//                       return import(
//                         /* @vite-ignore */ join(
//                           app.config.server.baseURL ?? "",
//                           router.base,
//                           bundlerManifest[id].file
//                         )
//                       );
//                     },
//                     assets() {
//                       return [];
//                       // return createHtmlTagsForAssets(
//                       //   router,
//                       //   app,
//                       //   findAssetsInViteManifest(bundlerManifest, id)
//                       // );
//                     },
//                     output: {
//                       path: join("", bundlerManifest[id].file)
//                     }
//                   };
//                 }
//               }
//             }
//           )
//         };
//       }
//     }
//   );
//   (globalThis as any).MANIFEST = manifest;
// }

// createProdManifest();

export function virtualId(moduleName: string) {
  return `virtual:${moduleName}`;
}
