import { getSsrDevManifest } from "./dev-server-manifest.js";
import { getSsrProdManifest } from "./prod-server-manifest.js";

export function getSsrManifest(target: "client" | "server") {
  return import.meta.env.DEV ? getSsrDevManifest(target) : getSsrProdManifest()
}

export { getSsrManifest as getManifest }
