import { getSsrDevManifest } from "./dev-ssr-manifest.ts";
import { getSsrProdManifest } from "./prod-ssr-manifest.ts";

export function getSsrManifest(target: "client" | "ssr") {
	return import.meta.env.DEV ? getSsrDevManifest(target) : getSsrProdManifest();
}

export { getSsrManifest as getManifest };
