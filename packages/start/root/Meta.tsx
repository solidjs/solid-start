import { useContext } from "solid-js";
import { Assets, ssr } from "solid-js/web";
import { renderTags } from "@solidjs/meta";
import { ServerContext } from "../server/ServerContext";

export default function Meta() {
  const context = useContext(ServerContext);
  // @ts-expect-error The ssr() types do not match the Assets child types
  return <Assets>{ssr(renderTags(context.tags))}</Assets>;
}
