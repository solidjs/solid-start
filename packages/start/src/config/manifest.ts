import { PluginOption } from "vite";

import { VIRTUAL_MODULES } from "./constants.ts";
import { SolidStartOptions } from "./index.ts";
import { findStylesInModuleGraph } from "../server/collect-styles.ts";

export function manifest(start: SolidStartOptions): PluginOption {
  return {
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
        if (this.environment.mode !== "dev") throw new Error("@manifest queries are only allowed in dev");

				const [path, query] = id.split("?");
        const target = id.split("/")[2]!;
				const params = new URLSearchParams(query);
				if (!path || !query) return;
				if (path.endsWith("assets")) {
					const id = params.get("id");
					if (!id) {
						throw new Error("Missing id to get assets.");
					}

					const styles = await findStylesInModuleGraph(
						this.environment,
						id,
						target === "server",
					);

					const cssAssets = Object.entries(styles).map(([key, value]) => `{
						tag: "style",
						attrs: {
							type: "text/css",
							key: "${key}",
							"data-vite-dev-id": "${key}",
							"data-vite-ref": "0",
						},
						children: () => import("${value}?inline").then(mod => mod.default),
					}`);

					return `export default [${cssAssets.join(",")}]`;
				}
			}
		},
	}
}
