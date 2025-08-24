import { isAbsolute, join } from "pathe";
import type { ViteDevServer } from "vite";

import { findStylesInModuleGraph } from "../collect-styles.js";

export function getSsrDevManifest(target: "client" | "server") {
  const vite: ViteDevServer = (globalThis as any).VITE_DEV_SERVER;

  return {
    import(id: string) {
      const absolutePath = isAbsolute(id) ? id : join(process.cwd(), id);
      return vite.ssrLoadModule(join(absolutePath));
    },
    async getAssets(id: string) {
      const styles = await findStylesInModuleGraph(vite, id, target === "server");

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
  } satisfies StartManifest;
}

export { getSsrDevManifest as getSsrManifest }
