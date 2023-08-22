import { lazyRoute } from "@vinxi/solid";
import { useContext } from "solid-js";

import { routes as routeConfigs } from "./routes";
import { ServerContext } from "./ServerContext";

export function createRoutes() {
	function createRoute(route) {
		return {
			...route,
			component: lazyRoute(
				route.$component,
				import.meta.env.MANIFEST["client"],
				import.meta.env.MANIFEST["ssr"],
			),
			data: route.$$data ? route.$$data.require().routeData : undefined,
			children: route.children ? route.children.map(createRoute) : undefined,
		};
	}
	const routes = routeConfigs.map(createRoute);
	return routes;
}

export const FileRoutes = () => {
	const context = useContext(ServerContext);
	return context.routes as any;
};
