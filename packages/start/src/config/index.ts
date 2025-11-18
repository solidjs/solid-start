import { TanStackServerFnPlugin } from "@tanstack/server-functions-plugin";
import { defu } from "defu";
import { globSync } from "node:fs";
import { extname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { type PluginOption } from "vite";
import solid, { type Options as SolidOptions } from "vite-plugin-solid";

import {
	DEFAULT_EXTENSIONS,
	VIRTUAL_MODULES,
	VITE_ENVIRONMENTS,
} from "./constants.ts";
import { devServer } from "./dev-server.ts";
import {
	SolidStartClientFileRouter,
	SolidStartServerFileRouter,
} from "./fs-router.ts";
import { fsRoutes } from "./fs-routes/index.ts";
import type { BaseFileSystemRouter } from "./fs-routes/router.ts";
import lazy from "./lazy.ts";
import { manifest } from "./manifest.ts";
import { parseIdQuery } from "./utils.ts";

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
							"@solidjs/start/server/entry": handlers.server,
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
						"import.meta.env.START_APP_ENTRY": `"${appEntryPath}"`,
						"import.meta.env.START_CLIENT_ENTRY": `"${handlers.client}"`,
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
		manifest(start),
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
		lazy(),
		// Must be placed after fsRoutes, as treeShake will remove the
		// server fn exports added in by this plugin
		TanStackServerFnPlugin({
			// This is the ID that will be available to look up and import
			// our server function manifest and resolve its module
			manifestVirtualImportId: VIRTUAL_MODULES.serverFnManifest,
			directive: "use server",
			callers: [
				{
					envConsumer: "client",
					envName: VITE_ENVIRONMENTS.client,
					getRuntimeCode: () =>
						`import { createServerReference } from "${normalize(
							fileURLToPath(new URL("../server/server-runtime", import.meta.url)),
						)}"`,
					replacer: (opts) =>
						`createServerReference(${() => {}}, '${opts.functionId}', '${opts.extractedFilename}')`,
				},
				{
					envConsumer: "server",
					envName: VITE_ENVIRONMENTS.server,
					getRuntimeCode: () =>
						`import { createServerReference } from '${normalize(
							fileURLToPath(
								new URL("../server/server-fns-runtime", import.meta.url),
							),
						)}'`,
					replacer: (opts) =>
						`createServerReference(${opts.fn}, '${opts.functionId}', '${opts.extractedFilename}')`,
				}
			],
			provider: {
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
  		name: "solid-start:virtual-modules",
  		async resolveId(id) {
        const { filename, query } = parseIdQuery(id);

        let base;
        if (filename === VIRTUAL_MODULES.clientEntry)
          base = handlers.client;
        if (filename === VIRTUAL_MODULES.serverEntry)
          base = handlers.server;
        if (filename === VIRTUAL_MODULES.app)
          base = appEntryPath;

        if(base) {
          let id = (await this.resolve(base))?.id
          if (!id) return;

          if (query.size > 0) id += `?${query.toString()}`;
          return id
        }
  		}
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
