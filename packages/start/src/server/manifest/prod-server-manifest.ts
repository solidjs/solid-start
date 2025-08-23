import { manifest } from "solid-start:server-manifest"
import { join } from "pathe";

export function getSsrProdManifest() {
  const viteManifest = manifest.clientViteManifest;
  return {
    import(id) {
      return import(/* @vite-ignore */ id);
    },
    async getAssets(id) {
      return []
    },
    async json() {
      const json: Record<string, any> = {};

      const entryKeys = Object.keys(viteManifest)
        .filter((id) => viteManifest[id]?.isEntry)
        .map((id) => id);

      for (const entryKey of entryKeys) {
        json[entryKey] = {
          output: join(viteManifest[entryKey]!.file)
        }
      }

      return json
    }
  } satisfies StartManifest & { json(): Promise<Record<string, any>> };
}
