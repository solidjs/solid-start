import { DevEnvironment, EnvironmentModuleGraph, isCSSRequest, normalizePath, ResolvedConfig, Rollup, ViteBuilder, ViteDevServer, type PluginOption } from "vite";
import * as path from "node:path"
import * as fs from 'node:fs'

import { VIRTUAL_MODULES } from "./constants.ts";
import type { SolidStartOptions } from "./index.ts";
import { parseIdQuery } from "./utils.ts";
import { normalizeViteImportAnalysisUrl } from "./vite-utils.ts";
import assert from "node:assert";
import { findStylesInModuleGraph } from "../server/collect-styles.ts";

type ImportAssetsMeta = {
  id: string;
  key: string;
  importerEnvironment: string;
  isEntry: boolean;
}

const BUILD_ASSETS_MANIFEST_NAME = "__start_assets_manifest.js";

export function manifest(start: SolidStartOptions): PluginOption {
  let resolvedConfig!: ResolvedConfig;
  const importAssetsMetaMap: {
    [environment: string]: { [id: string]: ImportAssetsMeta };
  } = {};
  const bundleMap: { [environment: string]: Rollup.OutputBundle } = {};
  let server!: ViteDevServer;

  async function processAssetsImport(
    ctx: Rollup.PluginContext,
    id: string,
    options: {
      environment: string;
      isEntry: boolean;
    },
  ) {
    console.log({
      id,
      importerEnv: ctx.environment.name,
      env: options.environment
    })
    if (ctx.environment.mode === "dev") {
      const result: ImportAssetsResultRaw = {
        entry: undefined, // defined only on client
        js: [], // always empty
        css: [], // defined only on server
      };
      const environment = server.environments[options.environment];
      assert(environment, `Unknown environment: ${options.environment}`);
      if (options.environment === "client") {
        result.entry = normalizeViteImportAnalysisUrl(environment, id);
      }
      if (environment.name !== "client") {
        const collected = await collectCss(environment, id, {
          eager: /*pluginOpts?.experimental?.devEagerTransform ??*/ true,
        });
        result.css = collected.hrefs.map((href, i) => ({
          href,
          "data-vite-dev-id": collected.ids[i],
        }));
      }
      return JSON.stringify(result);
    } else {
      const map = (importAssetsMetaMap[options.environment] ??= {});
      const meta: ImportAssetsMeta = {
        id,
        // normalize key to have machine-independent build output
        key: path.relative(resolvedConfig.root, id),
        importerEnvironment: ctx.environment.name,
        isEntry: !!(map[id]?.isEntry || options.isEntry),
      };
      map[id] = meta;
      return `__assets_manifest[${JSON.stringify(options.environment)}][${JSON.stringify(meta.key)}]`;
    }
  }

  let writeAssetsManifestCalled = false;
  async function writeAssetsManifest(builder: ViteBuilder) {
    if (writeAssetsManifestCalled) return;
    writeAssetsManifestCalled = true;
    console.log(importAssetsMetaMap)

    // build manifest of imported assets
    const manifest: any = {};
    for (const [environmentName, metas] of Object.entries(
      importAssetsMetaMap,
    )) {
      // console.log({environmentName, bundleMap})
      const bundle = bundleMap[environmentName]!;
      const assetDepsMap = collectAssetDeps(bundle);
      for (const [id, meta] of Object.entries(metas)) {
        const found = assetDepsMap[id];
        if (!found) {
          builder.config.logger.error(
            `[vite-plugin-fullstack] failed to find built chunk for ${meta.id} imported by ${meta.importerEnvironment} environment`,
          );
          continue;
        }
        const result: ImportAssetsResultRaw = {
          js: [],
          css: [],
        };
        const { chunk, deps } = found;
        // TODO: base
        if (environmentName === "client") {
          result.entry = `/${chunk.fileName}`;
          result.js = deps.js.map((fileName) => ({
            href: `/${fileName}`,
          }));
        }
        result.css = deps.css.map((fileName) => ({
          href: `/${fileName}`,
        }));

        // add single css when `cssCodeSplit: false`
        // https://github.com/vitejs/vite/blob/3a92bc79b306a01b8aaf37f80b2239eaf6e488e7/packages/vite/src/node/plugins/css.ts#L999-L1011
        if (!builder.environments[environmentName]!.config.build.cssCodeSplit) {
          const singleCss = Object.values(bundle).find(
            (v) =>
              v.type === "asset" && v.originalFileNames.includes("style.css"),
          );
          if (singleCss) {
            result.css.push({ href: `/${singleCss.fileName}` });
          }
        }

        (manifest[environmentName] ??= {})[meta.key] = result;
      }
    }

    // write manifest to importer environments
    const importerEnvironments = new Set(
      Object.values(importAssetsMetaMap)
        .flatMap((metas) => Object.values(metas))
        .flatMap((meta) => meta.importerEnvironment),
    );
    console.log({importerEnvironments})
    for (const environmentName of importerEnvironments) {
      // cursed but it works lol
      // @ts-expect-error
      bundleMap[environmentName]![BUILD_ASSETS_MANIFEST_NAME]! = {
        type: "chunk",
        code: `export default ${JSON.stringify(manifest, null, 2)};`,
      };

      const outDir = builder.environments[environmentName]!.config.build.outDir;
      fs.writeFileSync(
        path.join(outDir, BUILD_ASSETS_MANIFEST_NAME),
        `export default ${JSON.stringify(manifest, null, 2)};`,
      );
    }
  }

	return [
		{
  		name: "solid-start:manifest-plugin",
  		enforce: "pre",
  		configResolved(config) {
        resolvedConfig = config;
  		},
      configureServer(_server) {
        server = _server
      },
  		async resolveId(id) {
  			if (id === VIRTUAL_MODULES.clientViteManifest)
  				return `\0${VIRTUAL_MODULES.clientViteManifest}`;
  			if (id === VIRTUAL_MODULES.getClientManifest)
  				return this.resolve(
  					new URL("../server/manifest/client-manifest", import.meta.url)
  						.pathname,
  				);
  			if (id === VIRTUAL_MODULES.getManifest) {
  				return this.environment.config.consumer === "client"
  					? this.resolve(
  							new URL("../server/manifest/client-manifest", import.meta.url)
  								.pathname,
  						)
  					: this.resolve(
  							new URL("../server/manifest/ssr-manifest", import.meta.url)
  								.pathname,
  						);
  			}
  			if (id === VIRTUAL_MODULES.middleware) {
  				if (start.middleware) return await this.resolve(start.middleware);
  				return `\0${VIRTUAL_MODULES.middleware}`;
  			}
  			if (id === VIRTUAL_MODULES.assetsManifest) {
          // assert.notEqual(this.environment.name, "client");
          // assert.equal(this.environment.mode, "build");
          return { id: id, external: true };
        }
        if(id === VIRTUAL_MODULES.assetsManifestRuntime) {
          return await this.resolve(new URL("../server/manifest-runtime", import.meta.url).pathname)
        }
  		},
  		async load(id) {
  			if (id === `\0${VIRTUAL_MODULES.clientViteManifest}`) {
  				let clientViteManifest: Record<string, Record<string, any>>;
  				if (this.environment.config.command === "serve") {
  					clientViteManifest = {};
  				} else {
  					const entry = Object.values(globalThis.START_CLIENT_BUNDLE).find(
  						(v) => "isEntry" in v && v.isEntry,
  					);
  					if (!entry) throw new Error("No client entry found");
  					clientViteManifest = JSON.parse(
  						(globalThis.START_CLIENT_BUNDLE[".vite/manifest.json"] as any)
  							.source,
  					);
  				}
  				return `export const clientViteManifest = ${JSON.stringify(clientViteManifest)};`;
  			} else if (id === `\0${VIRTUAL_MODULES.middleware}`)
  				return "export default {};";

  			const { filename, query } = parseIdQuery(id);

  			const assets = query.get("assets");
        query.delete("assets");
  			if (assets !== null) {
          let fullFilename = filename;
          if (query.size > 0) {
            fullFilename += `?${decodeURIComponent(query.toString())}`;
          }

          let assetArrays = [];
          if(assets) {
            assetArrays.push(await processAssetsImport(this, fullFilename, {
              environment: assets,
              isEntry: assets === "client",
            }));
          } else {
            assetArrays.push(await processAssetsImport(this, fullFilename, {
              environment: "client",
              isEntry: false,
            }));
            if(this.environment.name !== "client")
              assetArrays.push(await processAssetsImport(this, fullFilename, {
                environment: this.environment.name,
                isEntry: false,
              }));
          }

          let code = [`import * as __assets_runtime from "solid-start:assets-manifest-runtime";`];

          if(this.environment.mode === "build")
            code.push(`import __assets_manifest from "solid-start:assets-manifest";`)

          code.push(`export default ${assetArrays.length > 1 ? `__assets_runtime.mergeAssets(${assetArrays.join(", ")})` : assetArrays[0]}`)

          return code.join("\n")
  			}
  		},
  		// non-client builds can load assets manifest as external
      renderChunk(code, chunk) {
        if (code.includes("solid-start:assets-manifest")) {
          const replacement = normalizeRelativePath(
            path.relative(
              path.join(chunk.fileName, ".."),
              BUILD_ASSETS_MANIFEST_NAME,
            ),
          );
          code = code.replaceAll(
            "solid-start:assets-manifest",
            () => replacement,
          );
          return { code };
        }
        return;
      },
      writeBundle(_options, bundle) {
        bundleMap[this.environment.name] = bundle;
      },
      buildStart() {
        // dynamically add client entry during build
        if (
          this.environment.mode == "build" &&
          this.environment.name === "client"
        ) {
          const metas = importAssetsMetaMap["client"];
          if (metas) {
            for (const meta of Object.values(importAssetsMetaMap["client"]!)) {
              if (meta.isEntry) {
                this.emitFile({
                  type: "chunk",
                  id: meta.id,
                  preserveSignature: "exports-only",
                });
              }
            }
          }
        }
      },
      buildApp: {
        order: "pre",
        async handler(builder) {
          // expose writeAssetsManifest to builder
          (builder as any).writeAssetsManifest = async () => {
            await writeAssetsManifest(builder);
          };
        },
      },
  	},
    {
      name: "fullstack:write-assets-manifest-post",
      buildApp: {
        order: "post",
        async handler(builder) {
          // ensure this is called at least once
          await (builder as any).writeAssetsManifest();
        },
      },
    }
	]
}


async function collectCss(
  environment: DevEnvironment,
  entryId: string,
  options: { eager: boolean },
) {
  const visited = new Set<string>();
  const cssIds = new Set<string>();

  async function recurse(id: string) {
    if (
      visited.has(id) ||
      // parseAssetsVirtual(id) ||
      "assets" in parseIdQuery(id).query
    ) {
      return;
    }
    visited.add(id);
    const mod = environment.moduleGraph.getModuleById(id);
    if (!mod) return;
    if (options.eager && !mod?.transformResult) {
      try {
        await environment.transformRequest(id);
      } catch (e) {
        console.error(`[collectCss] Failed to transform '${id}'`, e);
      }
    }
    // TODO: should skip dynamic imports? but no such metadata in dev module graph.
    for (const next of mod?.importedModules ?? []) {
      if (next.id) {
        if (isCSSRequest(next.id)) {
          if (hasSpecialCssQuery(next.id)) {
            continue;
          }
          cssIds.add(next.id);
        } else {
          await recurse(next.id);
        }
      }
    }
  }

  await recurse(entryId);

  // this doesn't include ?t= query so that RSC <link /> won't keep adding styles.
  const hrefs = [...cssIds].map((id) =>
    normalizeViteImportAnalysisUrl(environment, id),
  );
  return { ids: [...cssIds], hrefs };
}

function hasSpecialCssQuery(id: string): boolean {
  return /[?&](url|inline|raw)(\b|=|&|$)/.test(id);
}

function collectAssetDeps(bundle: Rollup.OutputBundle) {
  const chunkToDeps = new Map<Rollup.OutputChunk, any>();
  for (const chunk of Object.values(bundle)) {
    if (chunk.type === "chunk") {
      chunkToDeps.set(chunk, collectAssetDepsInner(chunk.fileName, bundle));
    }
  }
  const idToDeps: any = {};
  for (const [chunk, deps] of chunkToDeps.entries()) {
    for (const id of chunk.moduleIds) {
      idToDeps[id] = { chunk, deps };
    }
  }
  return idToDeps;
}

function collectAssetDepsInner(
  fileName: string,
  bundle: Rollup.OutputBundle,
): any {
  const visited = new Set<string>();
  const css: string[] = [];

  function recurse(k: string) {
    if (visited.has(k)) return;
    visited.add(k);
    const v = bundle[k];
    // assert(v, `Not found '${k}' in the bundle`);
    if (v.type === "chunk") {
      css.push(...(v.viteMetadata?.importedCss ?? []));
      for (const k2 of v.imports) {
        // server external imports is not in bundle
        if (k2 in bundle) {
          recurse(k2);
        }
      }
    }
  }

  recurse(fileName);
  return {
    js: [...visited],
    css: [...new Set(css)],
  };
}


export function normalizeRelativePath(s: string): string {
  s = normalizePath(s);
  return s[0] === "." ? s : "./" + s;
}
