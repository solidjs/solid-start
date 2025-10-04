import {
	createApp,
	createEvent,
	type EventHandler,
	eventHandler,
	getHeader,
} from "h3";
import {
	type Connect,
	isRunnableDevEnvironment,
	type PluginOption,
	type ViteDevServer,
} from "vite";
import { VITE_ENVIRONMENT_NAMES } from "../constants.js";

export function devServerPlugin(): PluginOption {
	return {
		name: "solid-start:dev-server-plugin",
		configureServer(viteDevServer) {
			(globalThis as any).VITE_DEV_SERVER = viteDevServer;
			return async () => {
				removeHtmlMiddlewares(viteDevServer);

				const serverEnv =
					viteDevServer.environments[VITE_ENVIRONMENT_NAMES.server];

				if (!serverEnv) throw new Error("Server environment not found");
				if (!isRunnableDevEnvironment(serverEnv))
					throw new Error("Server environment is not runnable");

				const h3App = createApp();

				h3App.use(
					eventHandler(async (event) => {
						const serverEntry: {
							default: EventHandler;
						} = await serverEnv.runner.import("./src/entry-server.tsx");

						return await serverEntry.default(event).catch((e: unknown) => {
							console.error(e);
							viteDevServer.ssrFixStacktrace(e as Error);

							if (
								getHeader(event, "content-type")?.includes("application/json")
							) {
								return Response.json(
									{
										status: 500,
										error: "Internal Server Error",
										message:
											"An unexpected error occurred. Please try again later.",
										timestamp: new Date().toISOString(),
									},
									{
										status: 500,
										headers: {
											"Content-Type": "application/json",
										},
									},
								);
							}

							return new Response(
								`
                  <!DOCTYPE html>
                  <html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <title>Error</title>
                      <script type="module">
                        import { ErrorOverlay } from '/@vite/client'
                        document.body.appendChild(new ErrorOverlay(${JSON.stringify(
													prepareError(event.node.req, e),
												).replace(/</g, "\\u003c")}))
                      </script>
                    </head>
                    <body>
                    </body>
                  </html>
                `,
								{
									status: 500,
									headers: {
										"Content-Type": "text/html",
									},
								},
							);
						});
					}),
				);

				viteDevServer.middlewares.use(async (req, res) => {
					const event = createEvent(req, res);
					event.context.viteDevServer = viteDevServer;
					await h3App.handler(event);
				});
			};
		},
	};
}

/**
 * Removes Vite internal middleware
 *
 * @param server
 */
function removeHtmlMiddlewares(server: ViteDevServer) {
	const html_middlewares = [
		"viteIndexHtmlMiddleware",
		"vite404Middleware",
		"viteSpaFallbackMiddleware",
	];
	for (let i = server.middlewares.stack.length - 1; i > 0; i--) {
		if (
			html_middlewares.includes(
				// @ts-expect-error
				server.middlewares.stack[i].handle.name,
			)
		) {
			server.middlewares.stack.splice(i, 1);
		}
	}
}

/**
 * Formats error for SSR message in error overlay
 * @param req
 * @param error
 * @returns
 */
function prepareError(req: Connect.IncomingMessage, error: unknown) {
	const e = error as Error;
	return {
		message: `An error occured while server rendering ${req.url}:\n\n\t${
			typeof e === "string" ? e : e.message
		} `,
		stack: typeof e === "string" ? "" : e.stack,
	};
}
