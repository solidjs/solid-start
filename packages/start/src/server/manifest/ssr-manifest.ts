import { getSsrDevManifest } from "./dev-ssr-manifest.js";
import { getSsrProdManifest } from "./prod-ssr-manifest.js";

export function getSsrManifest(target: "client" | "server") {
  return import.meta.env.DEV ? getSsrDevManifest(target) : getSsrProdManifest()
}

export { getSsrManifest as getManifest }
