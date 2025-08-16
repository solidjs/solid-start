import { manifest } from "solid-start:server-manifest";
import path, { isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { normalizePath } from "vite";

export const CLIENT_BASE_PATH = "_build";

export function getClientEntryPath() {
  if (import.meta.env.DEV)
    return normalizePath(path.join("/@fs", path.resolve(process.cwd(), manifest.clientEntryId)));

  const viteManifestEntry = manifest.clientViteManifest[manifest.clientEntryId];
  if (!viteManifestEntry) throw new Error("No entry found in vite manifest");

  return `/${CLIENT_BASE_PATH}/${viteManifestEntry.file}`;
}

export function getClientEntryCssTags() {
  return getManifestEntryCssTags(manifest.clientEntryId);
}

export function getManifestEntryCssTags(id: string) {
  if (import.meta.env.DEV) return [];

  const entry = manifest.clientViteManifest[id];
  if (!entry) throw new Error(`No entry '${id}' found in vite manifest`);

  return (
    entry.css?.map(css => ({
      tag: "link",
      attrs: { href: `/${CLIENT_BASE_PATH}/${css}`, rel: "stylesheet" }
    })) ?? []
  );
}
