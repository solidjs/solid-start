import { manifest } from "solid-start:server-manifest"
import { join } from "pathe";

// Only reads from client manifest atm, might need server support for islands
export function getSsrProdManifest() {
  const viteManifest = manifest.clientViteManifest;
  return {
    import(id) {
      return import(/* @vite-ignore */ id);
    },
    async getAssets(id) {
      return createHtmlTagsForAssets(
        findAssetsInViteManifest(manifest.clientViteManifest, id),
      );
    },
    async json() {
      const json: Record<string, any> = {};

      const entryKeys = Object.keys(viteManifest)
        .filter((id) => viteManifest[id]?.isEntry)
        .map((id) => id);

      for (const entryKey of entryKeys) {
        json[entryKey] = {
          output: join("/", CLIENT_BASE_PATH, viteManifest[entryKey]!.file),
          assets: await this.getAssets(entryKey)
        };
      }

      return json
    }
  } satisfies StartManifest & { json(): Promise<Record<string, any>> };
}

const CLIENT_BASE_PATH = "_build";

function createHtmlTagsForAssets(assets: string[]) {
  return assets
    .filter(
      (asset) =>
        asset.endsWith(".css") ||
        asset.endsWith(".js") ||
        asset.endsWith(".mjs"),
    )
    .map((asset) => ({
      tag: "link",
      attrs: {
        href: join("/", CLIENT_BASE_PATH, asset),
        key: join("/", CLIENT_BASE_PATH, asset),
        ...(asset.endsWith(".css")
          ? { rel: "stylesheet", fetchPriority: "high" }
          : { rel: "modulepreload" }),
      },
    }));
}

function findAssetsInViteManifest(manifest: any, id: string, assetMap = new Map(), stack: string[] = []) {
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
    ...(chunk.css?.filter(Boolean) || [])
  ];
  if (chunk.imports) {
    stack.push(id);
    for (let i = 0, l = chunk.imports.length; i < l; i++) {
      assets.push(...findAssetsInViteManifest(manifest, chunk.imports[i], assetMap, stack));
    }
    stack.pop();
  }
  assets.push(chunk.file);
  const all = Array.from(new Set(assets));
  assetMap.set(id, all);

  return all;
}
