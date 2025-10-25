import { getStyleElementsForId } from "../dev/css";

export function getSsrDevManifest(environment: "client" | "ssr") {
  return {
    async getAssets(id) {
      return getStyleElementsForId(id, environment)
    },
  } satisfies StartManifest;
}

export { getSsrDevManifest as getSsrManifest };
