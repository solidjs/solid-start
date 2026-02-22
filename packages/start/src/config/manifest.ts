import { type PluginOption, type ViteDevServer } from "vite";

import { findStylesInModuleGraph } from "../server/collect-styles.ts";
import { VIRTUAL_MODULES } from "./constants.ts";
import { type SolidStartOptions } from "./index.ts";
import { wrapId } from "./vite-utils.ts";

export function manifest(start: SolidStartOptions): PluginOption {
  let devServer: ViteDevServer = undefined!;
  return {
    name: "solid-start:manifest-plugin",
    enforce: "pre",
    configureServer(server) {
      devServer = server;
    },
    async resolveId(id) {
      if (id === VIRTUAL_MODULES.clientViteManifest)
        return `\0${VIRTUAL_MODULES.clientViteManifest}`;
      if (id === VIRTUAL_MODULES.getClientManifest)
        return this.resolve(
          new URL("../server/manifest/client-manifest", import.meta.url).pathname,
        );
      if (id === VIRTUAL_MODULES.getManifest) {
        return this.environment.config.consumer === "client"
          ? this.resolve(new URL("../server/manifest/client-manifest", import.meta.url).pathname)
          : this.resolve(new URL("../server/manifest/ssr-manifest", import.meta.url).pathname);
      }
      if (id === VIRTUAL_MODULES.middleware) {
        if (start.middleware) return await this.resolve(start.middleware);
        return `\0${VIRTUAL_MODULES.middleware}`;
      }
    },
    async load(id) {
      if (id === `\0${VIRTUAL_MODULES.clientViteManifest}`) {
        let clientViteManifest: Record<string, Record<string, any>>;
        if (this.environment.config.command === "serve") {
          clientViteManifest = {};
        } else {
          const entry = Object.values(globalThis.START_CLIENT_BUNDLE).find(
            v => "isEntry" in v && v.isEntry,
          );
          if (!entry) throw new Error("No client entry found");
          let viteStrVersion = (devServer?.config?.logger as any)?.config?.version;
          if (!viteStrVersion) {
            try {
              viteStrVersion = await import("vite").then(m => m.version);
            } catch (e) {
              // ignore
            }
          }

          let rawManifest: string | undefined;

          const viteMajor = parseInt(viteStrVersion!.split('.')[0], 10);

          const manifestKey = Object.keys(globalThis.START_CLIENT_BUNDLE).find(k => k.endsWith("manifest.json"));
          if (manifestKey && viteMajor < 8) {
            const manifestAsset = globalThis.START_CLIENT_BUNDLE[manifestKey] as any;
            if (manifestAsset.type === "asset") {
               rawManifest = manifestAsset.source as string;
            } else if (manifestAsset.type === "chunk") {
               rawManifest = manifestAsset.code as string;
            } else if (typeof manifestAsset === "string") {
               rawManifest = manifestAsset;
            } else {
               rawManifest = manifestAsset.source || manifestAsset.code || JSON.stringify(manifestAsset);
            }
          } else {
             const fs = await import("node:fs");
             const path = await import("node:path");
             try {
               const appRoot = (start as any).appRoot || "./src";
               const manifestPath = path.resolve(appRoot, "..", ".solid-start/client/.vite/manifest.json");
               rawManifest = fs.readFileSync(manifestPath, "utf-8");
             } catch (e) {
               throw new Error(`Manifest asset not found in bundle and could not be read from disk. Keys: ${Object.keys(globalThis.START_CLIENT_BUNDLE).join(", ")}. Error: ${e}`);
             }
          }

          if (!rawManifest) {
            throw new Error("Failed to extract or read raw manifest.");
          }

          clientViteManifest = JSON.parse(rawManifest);
        }
        return `export const clientViteManifest = ${JSON.stringify(clientViteManifest)};`;
      } else if (id === `\0${VIRTUAL_MODULES.middleware}`) return "export default {};";
      else if (id.startsWith("/@manifest")) {
        if (this.environment.mode !== "dev")
          throw new Error("@manifest queries are only allowed in dev");

        const [path, query] = id.split("?");
        const target = id.split("/")[2]!;
        const params = new URLSearchParams(query);
        if (!path || !query) return;
        if (path.endsWith("assets")) {
          const id = params.get("id");
          if (!id) {
            throw new Error("Missing id to get assets.");
          }

          // Client env does not have css dependencies in mod.transformResult
          // Aalways use ssr env instead, to prevent hydration mismatches
          const env = devServer.environments["ssr"];
          const styles = await findStylesInModuleGraph(env, id);

          const cssAssets = Object.entries(styles).map(
            ([key, value]) => `{
						tag: "style",
						attrs: {
							type: "text/css",
							"data-vite-dev-id": "${wrapId(key)}",
							"data-vite-ref": "0",
						},
						children: () => import("${wrapId(value)}?inline").then(mod => mod.default),
					}`,
          );

          return `export default [${cssAssets.join(",")}]`;
        }
      }
    },
  };
}
