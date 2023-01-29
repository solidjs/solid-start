import { JSXElement, useContext } from "solid-js";
import { useAssets } from "solid-js/web";
import { ServerContext } from "../server/ServerContext";
import type { IslandManifest, ManifestEntry, PageEvent } from "../server/types";
import { routeLayouts } from "./InlineStyles";

type NotUndefined<T> = T extends undefined ? never : T;

type RouterContext = NotUndefined<PageEvent["routerContext"]>

function flattenIslands(match: ManifestEntry[], manifest: Record<string, ManifestEntry> | IslandManifest) {
  let result = [...match];
  match.forEach(m => {
    if (m.type !== "island") return;
    const islandManifest = manifest[m.href as keyof typeof manifest] as unknown as IslandManifest | undefined;
    if (islandManifest) {
      const res = flattenIslands((islandManifest as IslandManifest).assets, manifest);
      result.push(...res);
    }
  });
  return result;
}

function getAssetsFromManifest(
  manifest: PageEvent["env"]["manifest"],
  routerContext: RouterContext
) {
  let match = routerContext.matches ? routerContext.matches.reduce<ManifestEntry[]>((memo, m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match) => previous + match.originalPath, "");
      const route = routeLayouts[fullPath];
      if (route) {
        memo.push(...((manifest![route.id] || []) as ManifestEntry[]));
        const layoutsManifestEntries = route.layouts.flatMap(
          manifestKey => (manifest![manifestKey as keyof typeof manifest] || []) as ManifestEntry[]
        );
        memo.push(...layoutsManifestEntries);
      }
    }
    return memo;
  }, []) : [];

  match.push(...((manifest!["entry-client"] || []) as ManifestEntry[]));

  match = manifest ? flattenIslands(match, manifest as any) : [];

  const links = match.reduce((r, src) => {
    r[src.href] =
      src.type === "style" ? (
        <link rel="stylesheet" href={src.href} $ServerOnly />
      ) : src.type === "script" ? (
        <link rel="modulepreload" href={src.href} $ServerOnly />
      ) : undefined;
    return r;
  }, {} as Record<string, JSXElement>);

  return Object.values(links);
}

/**
 * Links are used to load assets for the server rendered HTML
 * @returns {JSXElement}
 */
export default function Links() {
  const isDev = import.meta.env.MODE === "development";
  const context = useContext(ServerContext);
  !isDev &&
    import.meta.env.START_SSR &&
    useAssets(() => getAssetsFromManifest(context!.env.manifest, context!.routerContext!));
  return null;
}
