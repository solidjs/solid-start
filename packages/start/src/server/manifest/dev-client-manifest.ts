import { join } from "pathe";
import { getStyleElementsForId } from "../dev/css";

export function getClientDevManifest() {
  return {
    import(id) {
      return import(/* @vite-ignore */ join("/", id))
    },
    async getAssets(id) {
      return getStyleElementsForId(id, "client")
    },
  } satisfies StartManifest & { import(id: string): Promise<any> };
}
