import { isAbsolute, join } from "pathe";
import type { ViteDevServer } from "vite";

import { findStylesInModuleGraph } from "../collect-styles.js";

export function getSsrDevManifest(ssr: boolean, clientEntryId: string): StartManifest {
  const vite: ViteDevServer = (globalThis as any).VITE_DEV_SERVER;

  return {
    import(id: string) {
      const absolutePath = isAbsolute(id) ? id : join(process.cwd(), id);
      return vite.ssrLoadModule(join(absolutePath));
    },
    async getAssets(id: string) {
      const styles = await findStylesInModuleGraph(vite, id, ssr);

      return Object.entries(styles).map(([key, value]) => ({
        tag: "style",
        attrs: {
          type: "text/css",
          key,
          "data-vite-dev-id": key,
          "data-vite-ref": "0",
        },
        children: value,
      }));
    },
    // handler() {
    //   if (ssr) throw new Error("Not implemented");
    //   return normalizePath(path.join("/@fs", path.resolve(process.cwd(), clientEntryId)));
    // }
  } satisfies StartManifest;
}

export { getSsrDevManifest as getSsrManifest }
