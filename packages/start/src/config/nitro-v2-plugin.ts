import { dirname, resolve } from "node:path";
import {
	build,
	copyPublicAssets,
	createNitro,
	type NitroConfig,
	prepare,
	prerender,
} from "nitropack";
import type {
	EnvironmentOptions,
	PluginOption,
	ResolvedConfig,
	Rollup,
} from "vite";
import { VITE_ENVIRONMENT_NAMES } from "../constants.js";

let ssrBundle: Rollup.OutputBundle;
let ssrEntryFile: string;

function isFullUrl(str: string): boolean {
	try {
		new URL(str);
		return true;
	} catch {
		return false;
	}
}

export function nitroV2Plugin(nitroConfig?: NitroConfig): PluginOption {
	let resolvedConfig: ResolvedConfig;
	return {
		name: "solid-start:nitro-v2-plugin",
		generateBundle: {
			handler(_options, bundle) {
				if (this.environment.name !== "ssr") {
					return;
				}

				// find entry point of ssr bundle
				let entryFile: string | undefined;
				for (const [_name, file] of Object.entries(bundle)) {
					if (file.type === "chunk") {
						if (file.isEntry) {
							if (entryFile !== undefined) {
								this.error(
									`Multiple entry points found for service "${this.environment.name}". Only one entry point is allowed.`,
								);
							}
							entryFile = file.fileName;
						}
					}
				}
				if (entryFile === undefined) {
					this.error(
						`No entry point found for service "${this.environment.name}".`,
					);
				}
				ssrEntryFile = entryFile!;
				ssrBundle = bundle;
			},
		},
		configResolved(config) {
			resolvedConfig = config;
		},
		config(_, env) {
			if (env.command !== "build") {
				return;
			}

			return {
				environments: {
					ssr: {
						consumer: "server",
						build: {
							ssr: true,
							// we don't write to the file system as the below 'capture-output' plugin will
							// capture the output and write it to the virtual file system
							write: false,
							copyPublicDir: false,
						},
					},
				},
				builder: {
					sharedPlugins: true,
					async buildApp(builder) {
						const clientEnv =
							builder.environments[VITE_ENVIRONMENT_NAMES.client];
						const serverEnv =
							builder.environments[VITE_ENVIRONMENT_NAMES.server];

						if (!clientEnv) throw new Error("Client environment not found");
						if (!serverEnv) throw new Error("SSR environment not found");

						await builder.build(clientEnv);
						await builder.build(serverEnv);

						const virtualEntry = "#solid-start/entry";
						const baseURL = !isFullUrl(resolvedConfig.base)
							? resolvedConfig.base
							: undefined;

						const config: NitroConfig = {
							baseURL,
							typescript: {
								generateTsConfig: false,
								generateRuntimeConfigTypes: false,
							},
							publicAssets: [{ dir: clientEnv.config.build.outDir }],
							...nitroConfig,
							routeRules: {
								...nitroConfig?.routeRules,
								[`/${clientEnv.config.build.assetsDir}/**`]: {
									headers: {
										"cache-control": "public, immutable, max-age=31536000",
									},
								},
							},
							experimental: {
								asyncContext: true,
								...nitroConfig?.experimental,
							},
							renderer: virtualEntry,
							rollupConfig: {
								...nitroConfig?.rollupConfig,
								plugins: [virtualBundlePlugin(ssrBundle) as any],
							},
							virtual: {
								...nitroConfig?.virtual,
								[virtualEntry]: `import { fromWebHandler } from 'h3'
                                    import handler from '${ssrEntryFile}'
                                    export default handler`,
							},
						};

						const nitro = await createNitro(config);

						await prepare(nitro);
						await copyPublicAssets(nitro);
						await prerender(nitro);
						await build(nitro);

						await nitro.close();
					},
				},
			};
		},
	};
}

function virtualBundlePlugin(ssrBundle: Rollup.OutputBundle): PluginOption {
	type VirtualModule = { code: string; map: string | null };
	const _modules = new Map<string, VirtualModule>();

	// group chunks and source maps
	for (const [fileName, content] of Object.entries(ssrBundle)) {
		if (content.type === "chunk") {
			const virtualModule: VirtualModule = {
				code: content.code,
				map: null,
			};
			const maybeMap = ssrBundle[`${fileName}.map`];
			if (maybeMap && maybeMap.type === "asset") {
				virtualModule.map = maybeMap.source as string;
			}
			_modules.set(fileName, virtualModule);
			_modules.set(resolve(fileName), virtualModule);
		}
	}

	return {
		name: "virtual-bundle",
		resolveId(id, importer) {
			if (_modules.has(id)) {
				return resolve(id);
			}

			if (importer) {
				const resolved = resolve(dirname(importer), id);
				if (_modules.has(resolved)) {
					return resolved;
				}
			}
			return null;
		},
		load(id) {
			const m = _modules.get(id);
			if (!m) {
				return null;
			}
			return m;
		},
	};
}
