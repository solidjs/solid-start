import { JSXElement, useContext } from "solid-js";
import { Assets } from "solid-js/web";
import { ServerContext } from "../server/ServerContext";
import { ContextMatches, ManifestEntry, PageEvent } from "../server/types";

function getAssetsFromManifest(
  manifest: PageEvent["env"]["manifest"],
  routerContext: PageEvent["routerContext"]
) {
  console.log(manifest);

  const match = routerContext.matches.reduce<ManifestEntry[]>((memo, m) => {
    const manifestEntries = routesToManifestKeys(m).flatMap(
      manifestKey => manifest[manifestKey] || []
    );
    memo.push(...manifestEntries);
    return memo;
  }, []);

  const links = match.reduce((r, src) => {
    r[src.href] =
      src.type === "style" ? (
        <link rel="stylesheet" href={src.href} $ServerOnly />
      ) : (
        <link rel="modulepreload" href={src.href} $ServerOnly />
      );
    return r;
  }, {} as Record<string, JSXElement>);

  return Object.values(links);
}

function routesToManifestKeys(matches: ContextMatches[]) {
  return matches.reduce<[string[], string]>(
    ([manifestKeys, previous], route, index) => {
      const currentSegment = route.originalPath
        .replace(/:(\w+)/, (f, g) => `[${g}]`)
        .replace(/\*(\w+)/, (f, g) => `[...${g}]`);
      const current = (index === 1 && previous === "/" ? "/index/" : previous) + currentSegment;
      manifestKeys[index] = current;
      return [manifestKeys, current];
    },
    [[], ""]
  )[0];
}

/**
 * Links are used to load assets for the server rendered HTML
 * @returns {JSXElement}
 */
export default function Links(): JSXElement {
  const isDev = import.meta.env.MODE === "development";
  const context = useContext(ServerContext);
  return (
    <Assets>{!isDev && getAssetsFromManifest(context.env.manifest, context.routerContext)}</Assets>
  );
}
