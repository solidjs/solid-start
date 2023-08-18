import fileRoutes from "vinxi/routes";

const defineRoutes = (fileRoutes) => {
	function processRoute(routes, route, id, full) {
		const parentRoute = Object.values(routes).find((o) => {
			// if (o.id.endsWith("/index")) {
			// 	return false;
			// }
			return id.startsWith(o.path + "/");
		});

		if (!parentRoute) {
			routes.push({ ...route, path: id });
			return routes;
		}
		processRoute(
			parentRoute.children || (parentRoute.children = []),
			route,
			id.slice(parentRoute.path.length),
			full,
		);

		return routes;
	}

	return fileRoutes
		.sort((a, b) => a.path.length - b.path.length)
		.reduce((prevRoutes, route) => {
			return processRoute(prevRoutes, route, route.path, route.path);
		}, []);
};

export const routes = defineRoutes(fileRoutes);
