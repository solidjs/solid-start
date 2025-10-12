import { clientViteManifest } from "solid-start:client-vite-manifest";
import { join } from "pathe";
import { CLIENT_BASE_PATH } from "../../config/constants.ts";
import type { Asset } from "../renderAsset.tsx";

// Only reads from client manifest atm, might need server support for islands
export function getSsrProdManifest() {
	const viteManifest = clientViteManifest;
	return {
		path(id: string) {
			const viteManifestEntry =
				clientViteManifest[id /*import.meta.env.START_CLIENT_ENTRY*/];
			if (!viteManifestEntry)
				throw new Error("No entry found in vite manifest");

			return viteManifestEntry.file;
		},
		async getAssets(id) {
			return createHtmlTagsForAssets(
				findAssetsInViteManifest(clientViteManifest, id),
			);
		},
		async json() {
			const json: Record<string, any> = {};

			const entryKeys = Object.keys(viteManifest)
				.filter((id) => viteManifest[id]?.isEntry)
				.map((id) => id);

			for (const entryKey of entryKeys) {
				json[entryKey] = {
					output: join("/", viteManifest[entryKey]!.file),
					assets: await this.getAssets(entryKey),
				};
			}

			return json;
		},
	} satisfies StartManifest & {
		json(): Promise<Record<string, any>>;
		path(id: string): string;
	};
}

function createHtmlTagsForAssets(assets: string[]) {
	return assets
		.filter(
			(asset) =>
				asset.endsWith(".css") ||
				asset.endsWith(".ts") ||
				asset.endsWith(".mjs"),
		)
		.map<Asset>((asset) => ({
			tag: "link",
			attrs: {
				href: asset,
				key: asset,
				...(asset.endsWith(".css")
					? { rel: "stylesheet", fetchPriority: "high" }
					: { rel: "modulepreload" }),
			},
		}));
}

function findAssetsInViteManifest(
	manifest: any,
	id: string,
	assetMap = new Map(),
	stack: string[] = [],
) {
	if (stack.includes(id)) {
		return [];
	}

	const cached = assetMap.get(id);
	if (cached) {
		return cached;
	}
	const chunk = manifest[id];
	if (!chunk) {
		return [];
	}

	const assets = [
		...(chunk.assets?.filter(Boolean) || []),
		...(chunk.css?.filter(Boolean) || []),
	];
	if (chunk.imports) {
		stack.push(id);
		for (let i = 0, l = chunk.imports.length; i < l; i++) {
			assets.push(
				...findAssetsInViteManifest(
					manifest,
					chunk.imports[i],
					assetMap,
					stack,
				),
			);
		}
		stack.pop();
	}
	assets.push(chunk.file);
	const all = Array.from(new Set(assets));
	assetMap.set(id, all);

	return all;
}
