import { useContext } from "solid-js";
import { Assets } from "solid-js/web";
import { StartContext } from "./StartContext";

function getAssetsFromManifest(manifest, context) {
  let filePath = mapRouteToFile(context.matches[0]);
  const match = manifest[filePath];
  return match.map(src =>
    src.type === "style" ? (
      <link rel="stylesheet" href={src.href} $ServerOnly />
    ) : (
      <link rel="modulepreload" href={src.href} $ServerOnly />
    )
  );
}

function mapRouteToFile(matches) {
  return matches
    .map(h =>
      h.originalPath.replace(/:(\w+)/, (f, g) => `[${g}]`).replace(/\*(\w+)/, (f, g) => `[...${g}]`)
    )
    .join("");
}

export default function Links() {
  const isDev = import.meta.env.MODE === "development";
  const { manifest, context } = useContext(StartContext);
  return <Assets>{!isDev && getAssetsFromManifest(manifest, context)}</Assets>;
}