import { globSync } from "node:fs";
import { extname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { TanStackServerFnPluginEnv } from "@tanstack/server-functions-plugin";
import { defu } from "defu";
import { normalizePath, type PluginOption, type ViteDevServer } from "vite";
import solid, { type Options as SolidOptions } from "vite-plugin-solid";
import {
	DEFAULT_EXTENSIONS,
	VIRTUAL_MODULES,
	VITE_ENVIRONMENTS,
} from "./constants.ts";
import { isCssModulesFile } from "../server/collect-styles.ts";
import { getSsrDevManifest } from "../server/manifest/dev-ssr-manifest.ts";
import { devServer } from "./dev-server.ts";
import {
	SolidStartClientFileRouter,
	SolidStartServerFileRouter,
} from "./fs-router.ts";
import { fsRoutes } from "./fs-routes/index.ts";
import type { BaseFileSystemRouter } from "./fs-routes/router.ts";

export interface SolidStartOptions {
	solid?: Partial<SolidOptions>;
	ssr?: boolean;
	routeDir?: string;
	extensions?: string[];
	middleware?: string;
}

const absolute = (path: string, root: string) =>
	path ? (isAbsolute(path) ? path : join(root, path)) : path;

export function solidStart(options?: SolidStartOptions): Array<PluginOption> {
	const start = defu(options ?? {}, {
		appRoot: "./src",
		routeDir: "./routes",
		ssr: true,
		devOverlay: true,
		experimental: {
			islands: false,
		},
		solid: {},
		extensions: [],
	});
	const extensions = [...DEFAULT_EXTENSIONS, ...(start.extensions || [])];
	const routeDir = join(start.appRoot, start.routeDir);
	const root = process.cwd();
	const appEntryPath = globSync(join(root, start.appRoot, "app.{j,t}sx"))[0];
	if (!appEntryPath) {
		throw new Error(`Could not find an app jsx/tsx entry in ${start.appRoot}.`);
	}
	const entryExtension = extname(appEntryPath);
	const handlers = {
		client: `${start.appRoot}/entry-client${entryExtension}`,
		server: `${start.appRoot}/entry-server${entryExtension}`,
	};
	return [
		{
			name: "solid-start:config",
			enforce: "pre",
			configEnvironment(name) {
				return {
					define: {
						"import.meta.env.SSR": JSON.stringify(
							name === VITE_ENVIRONMENTS.server,
						),
					},
				};
			},
			async config(_, env) {
				const clientInput = [handlers.client];
				if (env.command === "build") {
					const clientRouter: BaseFileSystemRouter = (globalThis as any).ROUTERS
						.client;
					for (const route of await clientRouter.getRoutes()) {
						for (const [key, value] of Object.entries(route)) {
							if (value && key.startsWith("$") && !key.startsWith("$$")) {
								function toRouteId(route: any) {
									return `${route.src}?${route.pick.map((p: string) => `pick=${p}`).join("&")}`;
								}
								clientInput.push(toRouteId(value));
							}
						}
					}
				}
				return {
					appType: "custom",
					build: { assetsDir: "_build/assets" },
					environments: {
						[VITE_ENVIRONMENTS.client]: {
							consumer: "client",
							build: {
								copyPublicDir: false,
								write: true,
								manifest: true,
								outDir: "dist/client",
								rollupOptions: {
									input: clientInput,
									treeshake: true,
									preserveEntrySignatures: "exports-only",
								},
							},
						},
						[VITE_ENVIRONMENTS.server]: {
							consumer: "server",
							build: {
								ssr: true,
								write: true,
								manifest: true,
								copyPublicDir: false,
								rollupOptions: {
									input: "~/entry-server.tsx",
								},
								outDir: "dist/server",
								commonjsOptions: {
									include: [/node_modules/],
								},
							},
						},
					},
					resolve: {
						alias: {
							"#start/app": appEntryPath,
							"~": join(process.cwd(), start.appRoot),
							...(!start.ssr
								? {
										"@solidjs/start/server": "@solidjs/start/server/spa",
										"@solidjs/start/client": "@solidjs/start/client/spa",
									}
								: {}),
						},
					},
					define: {
						"import.meta.env.MANIFEST": `globalThis.MANIFEST`,
						"import.meta.env.START_SSR": JSON.stringify(start.ssr),
						"import.meta.env.START_APP_ENTRY": `"${normalizePath(appEntryPath)}"`,
						"import.meta.env.START_CLIENT_ENTRY": `"${normalizePath(handlers.client)}"`,
						"import.meta.env.START_DEV_OVERLAY": JSON.stringify(
							start.devOverlay,
						),
					},
					builder: {
						sharedPlugins: true,
						async buildApp(builder) {
							const client = builder.environments[VITE_ENVIRONMENTS.client];
							const server = builder.environments[VITE_ENVIRONMENTS.server];

							if (!client) throw new Error("Client environment not found");
							if (!server) throw new Error("SSR environment not found");

							if (!client.isBuilt) await builder.build(client);
							if (!server.isBuilt) await builder.build(server);
						},
					},
				};
			},
		},
		css(),
		fsRoutes({
			routers: {
				client: new SolidStartClientFileRouter({
					dir: absolute(routeDir, root),
					extensions,
				}),
				ssr: new SolidStartServerFileRouter({
					dir: absolute(routeDir, root),
					extensions,
					dataOnly: !start.ssr,
				}),
			},
		}),
		// Must be placed after fsRoutes, as treeShake will remove the
		// server fn exports added in by this plugin
		TanStackServerFnPluginEnv({
			// This is the ID that will be available to look up and import
			// our server function manifest and resolve its module
			manifestVirtualImportId: VIRTUAL_MODULES.serverFnManifest,
			client: {
				envName: VITE_ENVIRONMENTS.client,
				getRuntimeCode: () =>
					`import { createServerReference } from "${normalize(
						fileURLToPath(new URL("../server/server-runtime", import.meta.url)),
					)}"`,
				replacer: (opts) =>
					`createServerReference(${() => {}}, '${opts.functionId}', '${opts.extractedFilename}')`,
			},
			server: {
				envName: VITE_ENVIRONMENTS.server,
				getRuntimeCode: () =>
					`import { createServerReference } from '${normalize(
						fileURLToPath(
							new URL("../server/server-fns-runtime", import.meta.url),
						),
					)}'`,
				replacer: (opts) =>
					`createServerReference(${opts.fn}, '${opts.functionId}', '${opts.extractedFilename}')`,
			},
		}),
		{
			name: "solid-start:manifest-plugin",
			enforce: "pre",
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
				else if (id.startsWith("/@manifest")) {
					const [path, query] = id.split("?");
					const params = new URLSearchParams(query);
					if (!path || !query) return;
					if (path.endsWith("assets")) {
						const id = params.get("id");
						if (!id) {
							throw new Error("Missing id to get assets.");
						}
						return `export default ${JSON.stringify(
							await getSsrDevManifest("server").getAssets(id),
						)}`;
					}
				}
			},
		},
		{
			name: "solid-start:capture-client-bundle",
			enforce: "post",
			generateBundle(_options, bundle) {
				globalThis.START_CLIENT_BUNDLE = bundle;
			},
		},
		devServer(),
		solid({
			...start.solid,
			ssr: true,
			extensions: extensions.map((ext) => `.${ext}`),
		}),
	];
}

function css(): PluginOption {
	let viteServer!: ViteDevServer;
	const cssModules: Record<string, any> = {};
	return {
		name: "solid-start:css-hmr",
		configureServer(dev) {
			viteServer = dev;
		},
		async handleHotUpdate({ file, server }) {
			if (file.endsWith(".css")) {
				const resp = await server.transformRequest(file);
				if (!resp) return;
				const json = resp.code
					.match(/const __vite__css = .*\n/)?.[0]
					?.slice("const __vite__css = ".length);
				if (!json) return;
				resp.code = JSON.parse(json);
				viteServer.ws.send({
					type: "custom",
					event: "css-update",
					data: {
						file,
						contents: resp.code,
					},
				});
			}
		},
		transform(code, id) {
			if (isCssModulesFile(id)) {
				cssModules[id] = code;
			}
		},
	};
}
