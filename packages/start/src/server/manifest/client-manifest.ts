import { getClientDevManifest } from "./dev-client-manifest.ts";
import { getClientProdManifest } from "./prod-client-manifest.ts";

export function getClientManifest() {
	return import.meta.env.DEV ? getClientDevManifest() : getClientProdManifest();
}

export { getClientManifest as getManifest };
