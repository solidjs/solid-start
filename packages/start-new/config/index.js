import { join } from "path";
import { createApp } from "vinxi";
import {
	analyzeModule, BaseFileSystemRouter, cleanPath
} from "vinxi/file-system-router";
import { config } from "vinxi/lib/plugins/config";
import solid from "vite-plugin-solid";

class SolidStartFileSystemRouter extends BaseFileSystemRouter {
	toPath(src) {
		const routePath = cleanPath(src, this.config)
			// remove the initial slash
			.slice(1)
			.replace(/index$/, "")
			.replace(/\[([^\/]+)\]/g, (_, m) => {
				if (m.length > 3 && m.startsWith("...")) {
					return `*${m.slice(3)}`;
				}
				if (m.length > 2 && m.startsWith("[") && m.endsWith("]")) {
					return `:${m.slice(1, -1)}?`;
				}
				return `:${m}`;
			});

		return routePath?.length > 0 ? `/${routePath}` : "/";
	}

	toRoute(src) {
		let path = this.toPath(src);

		const [_, exports] = analyzeModule(src);
		const hasRouteData = exports.find((e) => e.n === "routeData");
		return {
			$component: {
				src: src,
				pick: ["default", "$css"],
			},
			$$data: hasRouteData
				? {
						src: src,
						pick: ["routeData"],
				  }
				: undefined,
			path,
			filePath: src,
		};
	}
}
export function defineConfig(baseConfig = {}) {
	const { plugins = [], ...userConfig } = baseConfig;
	return createApp({
		routers: [
			{
				name: "public",
				mode: "static",
				dir: "./public",
				base: "/",
			},
			{
				name: "client",
				mode: "build",
				handler: "./src/entry-client.tsx",
				style: SolidStartFileSystemRouter,
				dir: "./src/routes",
				build: {
					target: "browser",
					plugins: () => [
						config("user", userConfig),
						...plugins,
						solid({
							ssr: true,
						}),
						config("app", {
							resolve: {
								alias: {
									"#start/app": join(process.cwd(), "src", "app.tsx"),
									"~": join(process.cwd(), "src"),
								},
							},
						}),
					],
				},
				base: "/_build",
			},
			{
				name: "ssr",
				mode: "handler",
				handler: "./src/entry-server.tsx",
				dir: "./src/routes",
				style: SolidStartFileSystemRouter,
				build: {
					target: "node",
					plugins: () => [
						config("user", userConfig),
						...plugins,
						solid({ ssr: true }),
						config("app", {
							resolve: {
								alias: {
									"#start/app": join(process.cwd(), "src", "app.tsx"),
									"~": join(process.cwd(), "src"),
								},
							},
						}),
					],
				},
			},
		],
	});
}
