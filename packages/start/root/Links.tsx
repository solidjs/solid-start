import { JSXElement, useContext } from "solid-js";
import { Assets } from "solid-js/web";
import { ServerContext } from "../server/ServerContext";
import { ManifestEntry, PageEvent } from "../server/types";
import { routeLayouts } from "./FileRoutes";

function getAssetsFromManifest(
  manifest: PageEvent["env"]["manifest"],
  routerContext: PageEvent["routerContext"]
) {
  const match = routerContext.matches.reduce<ManifestEntry[]>((memo, m) => {
    if (m.length) {
      const fullPath = m.reduce((previous, match) => previous + match.originalPath, "");
      const route = routeLayouts[fullPath];
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
export default function Links(): JSXElement {
  const isDev = import.meta.env.MODE === "development";
  const context = useContext(ServerContext);
  return (
    <Assets>
      {!isDev &&
        import.meta.env.START_SSR &&
        getAssetsFromManifest(context.env.manifest, context.routerContext)}
    </Assets>
  );
}
