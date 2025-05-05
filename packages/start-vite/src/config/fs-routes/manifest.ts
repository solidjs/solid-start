import { PluginOption } from "vite";
import { isAbsolute, join, relative } from "node:path";

export function manifest(handlers: Record<"client" | "server", string>): Array<PluginOption> {
  return [
    {
      name: "solid-start-manifest",
      enforce: "pre",
      configureServer: viteServer => {
        const root = viteServer.config.root;
        (globalThis as any).MANIFEST = new Proxy(
          {},
          {
            get(_target, name: "client" | "server") {
              const environment = viteServer.environments[name]!;
              // invariant(typeof bundlerName === "string", "Bundler name expected");

              // let router = app.getRouter(bundlerName);

              // let base = join(app.config.server.baseURL ?? "", router.base);

              // if (target === "client") {
              //   return {
              //     json() {
              //       return {};
              //     },
              //     assets() {
              //       return {};
              //     },
              //     routes() {
              //       return [];
              //     },
              //     // base,
              //     target: "static",
              //     // type: router.type,
              //     handler: undefined,
              //     chunks: {},
              //     inputs: {}
              //   };
              // }

              // async function viteAssets(paths: string[], server: boolean) {
              //   // invariant(viteServer, "Vite server expected");
              //   return Object.entries(
              //     await findStylesInModuleGraph(viteServer, paths.filter(Boolean), server)
              //   ).map(([key, value]) => ({
              //     tag: "style",
              //     attrs: {
              //       type: "text/css",
              //       key,
              //       "data-vite-dev-id": key,
              //       "data-vite-ref": "0"
              //     },
              //     children: value
              //   }));
              // }

              return {
                json() {
                  return {};
                },
                assets() {
                  return {};
                },
                dev: {
                  server: viteServer
                },
                handler: handlers[name],
                // base,
                // target: router.target,
                // type: router.type,
                chunks: new Proxy(
                  {},
                  {
                    get(target, chunk: string) {
                      console.log({ chunk });
                      // invariant(typeof chunk === "string", "Chunk expected");
                      const absolutePath = isAbsolute(chunk) ? chunk : join(root, chunk);
                      // invariant(router.type != "static", "No manifest for static router");

                      if (target === "client") {
                        return {
                          output: {
                            path: join("@fs", absolutePath)
                          }
                        };
                      } else {
                        return {
                          import() {
                            console.log({ absolutePath });
                            return viteServer?.ssrLoadModule(absolutePath);
                          },
                          output: {
                            path: join(absolutePath)
                          }
                        };
                      }
                    }
                  }
                ),
                async routes() {
                  return [];
                  // return (await router.internals.routes?.getRoutes()) ?? [];
                },
                inputs: new Proxy(
                  {},
                  {
                    // ownKeys(target) {
                    // 	const keys = Object.keys(bundlerManifest)
                    // 		.filter((id) => bundlerManifest[id].isEntry)
                    // 		.map((id) => id);
                    // 	return keys;
                    // },
                    getOwnPropertyDescriptor(k) {
                      return {
                        enumerable: true,
                        configurable: true
                      };
                    },
                    get(target, input: string, receiver) {
                      // invariant(typeof input === "string", "Input string expected");
                      let absolutePath = isAbsolute(input) ? input : join(root, input);
                      let relativePath = relative(root, input);
                      // invariant(router.type != "static", "No manifest for static router");

                      let isHandler = handlers[name] === relativePath;

                      // async function getVitePluginAssets() {
                      //   const plugins = router.internals?.devServer
                      //     ? router.internals.devServer.config.plugins
                      //     : [];

                      //   // https://github.com/vitejs/vite/blob/167006e74751a66776f4f48316262449b19bf186/packages/vite/src/node/plugins/html.ts#L1253-L1264

                      //   const preHooks = [];
                      //   const normalHooks = [];
                      //   const postHooks = [];

                      //   for (const plugin of plugins) {
                      //     const hook = plugin.transformIndexHtml;
                      //     if (!hook) continue;

                      //     if (typeof hook === "function") {
                      //       normalHooks.push(hook);
                      //     } else {
                      //       // `enforce` had only two possible values for the `transformIndexHtml` hook
                      //       // `'pre'` and `'post'` (the default). `order` now works with three values
                      //       // to align with other hooks (`'pre'`, normal, and `'post'`). We map
                      //       // both `enforce: 'post'` to `order: undefined` to avoid a breaking change
                      //       const order =
                      //         hook.order ?? (hook.enforce === "pre" ? "pre" : undefined);
                      //       // @ts-expect-error union type
                      //       const handler = hook.handler ?? hook.transform;
                      //       if (order === "pre") {
                      //         preHooks.push(handler);
                      //       } else if (order === "post") {
                      //         postHooks.push(handler);
                      //       } else {
                      //         normalHooks.push(handler);
                      //       }
                      //     }
                      //   }

                      //   // @ts-ignore
                      //   const indexHtmlTransformers = [preHooks, normalHooks, postHooks].flat();

                      //   let pluginAssets = [];
                      //   // @ts-ignore
                      //   for (let transformer of indexHtmlTransformers) {
                      //     // @ts-ignore
                      //     let transformedHtml = await transformer("/", ``, `/`);

                      //     if (!transformedHtml) continue;
                      //     if (Array.isArray(transformedHtml)) {
                      //       pluginAssets.push(...transformedHtml);
                      //     } else if (transformedHtml.tags) {
                      //       pluginAssets.push(...(transformedHtml.tags ?? []));
                      //     }
                      //   }

                      //   return pluginAssets.map((asset, index) => {
                      //     return {
                      //       ...asset,
                      //       attrs: {
                      //         ...asset.attrs,
                      //         key: `plugin-${index}`
                      //       }
                      //     };
                      //   });
                      // }
                      //

                      if (name === "client") {
                        return {
                          import() {
                            return viteServer.ssrLoadModule(join(absolutePath));
                          },
                          async assets() {
                            return [
                              ...(viteServer
                                ? ([] as any[])
                                    // await viteAssets(
                                    //   [
                                    //     absolutePath.endsWith(".ts") && router.type === "spa"
                                    //       ? undefined
                                    //       : absolutePath
                                    //   ],
                                    //   false
                                    // )
                                    .filter(asset => !asset.attrs.key.includes("vinxi-devtools"))
                                : []),
                              ...(isHandler
                                ? [
                                    // ...(await getVitePluginAssets()),
                                    {
                                      tag: "script",
                                      attrs: {
                                        key: "vite-client",
                                        type: "module",
                                        src: join("", "@vite", "client")
                                      }
                                    }
                                  ]
                                : [])
                            ].filter(Boolean);
                          },
                          output: { path: join("/", relativePath) }
                        };
                      } else {
                        return {
                          import() {
                            console.log({ absolutePath });
                            return viteServer.ssrLoadModule(/* @vite-ignore */ join(absolutePath));
                          },
                          async assets() {
                            console.log("SERVER ASSETS");
                            return [];
                            // return [
                            //   ...(viteServer
                            //     ? (await viteAssets([input], true)).filter(
                            //         asset => !asset.attrs.key.includes("vinxi-devtools")
                            //       )
                            //     : [])
                          },
                          output: {
                            path: absolutePath
                          }
                        };
                      }
                    }
                  }
                )
              };
            }
          }
        );
      }
    }
  ];
}

// async function findStylesInModuleGraph(vite, match, server) {
//   const styles = {};
//   const dependencies = await findDependencies(vite, match, server);

//   for (const dep of dependencies) {
//     if (isCssFile(dep.url ?? "")) {
//       try {
//         let depURL = dep.url;
//         if (!isCssUrlWithoutSideEffects(depURL)) {
//           depURL = injectQuery(dep.url, "inline");
//         }

//         const mod = await vite.ssrLoadModule(depURL);
//         if (isCssModulesFile(dep.file)) {
//           styles[join(vite.config.root, dep.url)] = vite.cssModules?.[dep.file];
//         } else {
//           styles[join(vite.config.root, dep.url)] = mod.default;
//         }
//       } catch {
//         // this can happen with dynamically imported modules, I think
//         // because the Vite module graph doesn't distinguish between
//         // static and dynamic imports? TODO investigate, submit fix
//       }
//     }
//   }
//   return styles;
// }
