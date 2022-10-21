import { ManifestEntry, PageEvent } from "../server/types";
import { routesConfig } from "./FileRoutes";

function flattenIslands(match, manifest) {
  let result = [...match];
  match.forEach(m => {
    if (m.type !== "island") return;
    const islandManifest = manifest[m.href];
    if (islandManifest) {
      const res = flattenIslands(islandManifest.assets, manifest);
      result.push(...res);
    }
  });
  return result;
}

export function getAssetsFromManifest(
  manifest: PageEvent["env"]["manifest"],
  routerContext: PageEvent["routerContext"]["matches"]
) {
  let match = routerContext.reduce<ManifestEntry[]>((memo, m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match) => previous + match.originalPath, "");
      const route = routesConfig.routeLayouts[fullPath];
      if (route) {
        memo.push(...((manifest[route.id] || []) as ManifestEntry[]));
        const layoutsManifestEntries = route.layouts.flatMap(
          manifestKey => (manifest[manifestKey] || []) as ManifestEntry[]
        );
        memo.push(...layoutsManifestEntries);
      }
    }
    return memo;
  }, []);

  match.push(...((manifest["entry-client"] || []) as ManifestEntry[]));

  match = flattenIslands(match, manifest);

  return match;
}
