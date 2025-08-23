import { getClientDevManifest } from "./dev-client-manifest.js";
import { getClientProdManifest } from "./prod-client-manifest.js";

export function getClientManifest() {
  return import.meta.env.DEV ? getClientDevManifest() : getClientProdManifest()
}

export { getClientManifest as getManifest }
