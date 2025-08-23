import { manifest } from "solid-start:server-manifest"
import { getSsrDevManifest } from "./dev-server-manifest.js";
import { getSsrProdManifest } from "./prod-server-manifest.js";

export function getSsrManifest(server: boolean) {
  return import.meta.env.DEV ? getSsrDevManifest(server, manifest.clientEntryId) : getSsrProdManifest()
}

export { getSsrManifest as getManifest }
