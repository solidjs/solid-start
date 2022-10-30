import { ManifestEntry, PageEvent } from "../server/types";
import {} from "./FileRoutes";
import { routeLayouts } from "./routeLayouts";

function flattenIslands(match, manifest, islands) {
  let result = [...match];
  match.forEach(m => {
    if (m.type !== "island") return;
    const islandManifest = manifest[m.href];
    if (islandManifest && (!islands || islands.has(m.href))) {
      const res = flattenIslands(islandManifest.assets, manifest, islands);
      result.push(...res);
    }
  });
  return result;
}

export function getAssetsFromManifest(
  event: PageEvent,
  matches: PageEvent["routerContext"]["matches"]
) {
  let match = matches.reduce<ManifestEntry[]>((memo, m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match) => previous + match.originalPath, "");
      const route = routeLayouts[fullPath];
      if (route) {
        memo.push(...((event.env.manifest[route.id] || []) as ManifestEntry[]));
        const layoutsManifestEntries = route.layouts.flatMap(
          manifestKey => (event.env.manifest[manifestKey] || []) as ManifestEntry[]
        );
        memo.push(...layoutsManifestEntries);
      }
    }
    return memo;
  }, []);

  match.push(...((event.env.manifest["entry-client"] || []) as ManifestEntry[]));

  match = flattenIslands(match, event.env.manifest, event.$islands);

  return match;
}
