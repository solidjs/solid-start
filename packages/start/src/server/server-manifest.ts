import path from "node:path";
import { manifest } from "solid-start:server-manifest";
import { normalizePath } from "vite";
import { getManifestEntryCssTags } from "./collect-styles";

export const CLIENT_BASE_PATH = "_build";

export function getClientEntryPath() {
  if (import.meta.env.DEV)
    return normalizePath(path.join("/@fs", path.resolve(process.cwd(), import.meta.env.START_CLIENT_ENTRY)));

  const viteManifestEntry = manifest.clientViteManifest[import.meta.env.START_CLIENT_ENTRY];
  if (!viteManifestEntry) throw new Error("No entry found in vite manifest");

  return `/${CLIENT_BASE_PATH}/${viteManifestEntry.file}`;
}

export function getClientEntryCssTags() {
  return getManifestEntryCssTags(import.meta.env.START_CLIENT_ENTRY);
}
