import { renderTags } from "@solidjs/meta";
import { useContext } from "solid-js";
import { ssr, useAssets } from "solid-js/web";
import { ServerContext } from "../server/ServerContext";

export default function Meta() {
  const context = useContext(ServerContext);
  // @ts-expect-error The ssr() types do not match the Assets child types
  useAssets(() => ssr(renderTags(context.tags)));
  return null;
}
