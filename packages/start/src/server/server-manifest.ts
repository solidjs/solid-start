import path from "node:path";
import { manifest } from "solid-start:server-manifest";
import { normalizePath } from "vite";
import { getManifestEntryCssTags } from "./collect-styles";

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
