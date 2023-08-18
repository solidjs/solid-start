import { renderTags } from "@solidjs/meta";
import { useContext } from "solid-js";
import { ssr, useAssets } from "solid-js/web";

import { ServerContext } from "../entry-server/ServerContext";

export function Meta() {
	const context = useContext(ServerContext);
	useAssets(() => ssr(renderTags(context.tags)) as any);
	return null;
}
