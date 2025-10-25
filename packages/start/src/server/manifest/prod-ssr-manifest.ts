import { clientViteManifest } from "solid-start:client-vite-manifest";
import type { Asset } from "../renderAsset.tsx";

// Only reads from client manifest atm, might need server support for islands
export function getSsrProdManifest() {
	return {
		async getAssets(id) {
      if (id.startsWith("./")) id = id.slice(2);

			return createHtmlTagsForAssets(
				findAssetsInViteManifest(clientViteManifest, id),
			);
		},
	} satisfies StartManifest
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
