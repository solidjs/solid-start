import { join, normalize, resolve } from "pathe";
import type { ViteDevServer } from "vite";

import { findStylesInModuleGraph } from "../collect-styles.ts";

export function getSsrDevManifest(target: "client" | "server") {
	const vite: ViteDevServer = (globalThis as any).VITE_DEV_SERVER;

	return {
		path: (id: string) => normalize(join("/@fs", resolve(process.cwd(), id))),
		async getAssets(id: string) {
			const styles = await findStylesInModuleGraph(
				vite,
				id,
				target === "server",
			);

			return Object.entries(styles).map(([key, value]) => ({
				tag: "style" as const,
				attrs: {
					type: "text/css",
					key,
					"data-vite-dev-id": key,
					"data-vite-ref": "0",
				},
				children: value,
			}));
		},
	} satisfies StartManifest & {
		path(id: string): string;
	};
}

export { getSsrDevManifest as getSsrManifest };
