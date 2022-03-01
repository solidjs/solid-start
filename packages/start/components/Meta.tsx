import { useContext } from "solid-js";
import { Assets, ssr } from "solid-js/web";
import { renderTags } from "solid-meta";
import { StartContext } from "./StartContext";

export default function Meta() {
  const context = useContext(StartContext);
  return <Assets>{ssr(renderTags(context.tags))}</Assets>;
}
