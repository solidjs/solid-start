import { clientViteManifest } from "solid-start:client-vite-manifest";
import { join } from "pathe";
import { Manifest } from "vite";
import type { Asset } from "../assets/render.tsx";

// Only reads from client manifest atm, might need server support for islands
export function getSsrProdManifest() {
  const viteManifest = clientViteManifest;
  return {
    path(id: string) {
      if (id.startsWith("./")) id = id.slice(2);

      const viteManifestEntry = clientViteManifest[id /*import.meta.env.START_CLIENT_ENTRY*/];
      if (!viteManifestEntry) throw new Error(`No entry found in vite manifest for '${id}'`);

      return join("/", viteManifestEntry.file);
    },
    async getAssets(id) {
      if (id.startsWith("./")) id = id.slice(2);

      return createHtmlTagsForAssets(findAssetsInViteManifest(clientViteManifest, id));
    },
    async json() {
      const json: Record<string, any> = {};

      const entryKeys = Object.keys(viteManifest)
        .filter(id => viteManifest[id]?.isEntry || viteManifest[id]?.isDynamicEntry)
        .map(id => id);

      for (const entryKey of entryKeys) {
        json[entryKey] = {
          output: join("/", viteManifest[entryKey]!.file),
          assets: await this.getAssets(entryKey)
        };
      }

      return json;
    }
  } satisfies StartManifest & {
    json(): Promise<Record<string, any>>;
    path(id: string): string;
  };
}

function createHtmlTagsForAssets(assets: string[]) {
  return assets
    .filter(
      asset =>
        asset.endsWith(".css") ||
        asset.endsWith(".js") ||
        asset.endsWith(".ts") ||
        asset.endsWith(".mjs")
    )
    .map<Asset>(asset => ({
      tag: "link",
      attrs: {
        href: "/" + asset,
        key: asset,
        ...(asset.endsWith(".css") ? { rel: "stylesheet" } : { rel: "modulepreload" })
      }
    }));
}

const entryId = import.meta.env.START_CLIENT_ENTRY.slice(2);
let entryImports: string[] | undefined = undefined;

function findAssetsInViteManifest(
  manifest: Manifest,
  id: string,
  assetMap = new Map(),
  stack: string[] = []
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

  if (!entryImports) {
    entryImports = [entryId, ...(manifest[entryId]?.imports ?? [])];
  }

  // Only include entry imports, if we are specifically crawling the entry
  // Chunks (e.g. routes) that import something from entry, should not render entry css redundantly
  const excludeEntryImports = id !== entryId;

  const assets = chunk.css?.filter(Boolean) || [];
  if (chunk.imports) {
    stack.push(id);
    for (let i = 0, l = chunk.imports.length; i < l; i++) {
      const importId = chunk.imports[i];
      if (!importId || (excludeEntryImports && entryImports.includes(importId))) continue;
      assets.push(...findAssetsInViteManifest(manifest, importId, assetMap, stack));
    }
    stack.pop();
  }
  assets.push(chunk.file);
  const all = Array.from(new Set(assets));
  assetMap.set(id, all);

  return all;
}
