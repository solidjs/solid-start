import { renderToStream } from "solid-js/web";
import { eventHandler } from "vinxi/runtime/server";

import { createRoutes } from "../root/FileRoutes";

export function createHandler(fn) {
	return eventHandler(async (event) => {
		const clientManifest = import.meta.env.MANIFEST["client"];
		const context = {
			event,
			manifest: await clientManifest.json(),
			tags: [],
			routes: createRoutes(),
			assets: await clientManifest.inputs[clientManifest.handler].assets(),
		};
		const stream = renderToStream(() => fn(context), {});
		return stream;
	});
}
