import { NodeRequest, sendNodeResponse } from "srvx/node";
import {
  type Connect,
  isRunnableDevEnvironment,
  type PluginOption,
  type ViteDevServer,
} from "vite";
import { VITE_ENVIRONMENTS } from "./constants.ts";
import { join, resolve } from "node:path";
import { H3, serveStatic } from "h3";
import { stat, readFile } from "node:fs/promises";

type Server = {
  default: { fetch: (req: Request) => Promise<Response> };
};

export function devServer(): Array<PluginOption> {
  return [
    {
      name: "solid-start-dev-server",
      async configurePreviewServer(vitePreviewServer) {
        const { default: h3App }: Server = await import(
          resolve(process.cwd(), "dist/server/entry-server.js")
        );
        const app = new H3();
        app.use("/_build/**", event => {
          return serveStatic(event, {
            indexNames: ["/index.html"],
            headers: { "cache-control": "public, max-age=3156000, immutable" },
            getContents: id => readFile(join(process.cwd(), "dist/client", id)),
            getMeta: async id => {
              const stats = await stat(join("dist/client", id)).catch(() => {});
              if (stats?.isFile()) {
                return {
                  size: stats.size,
                  mtime: stats.mtimeMs,
                };
              }
            },
          });
        });
        app.mount("/", h3App);

        return async () => {
          vitePreviewServer.middlewares.use(async (req, res) => {
            const webReq = new NodeRequest({ req, res });

            const webRes = await app.fetch(webReq);
            sendNodeResponse(res, webRes);
          });
        };
      },
      configureServer(viteDevServer) {
        (globalThis as any).VITE_DEV_SERVER = viteDevServer;
        return async () => {
          if (viteDevServer.config.server.middlewareMode) return;

          const serverEnv = viteDevServer.environments[VITE_ENVIRONMENTS.server];

          if (!serverEnv) throw new Error("Server environment not found");
          if (
            // do not check via `isFetchableDevEnvironment` since nitro does implement the `FetchableDevEnvironment` interface but not via inheritance (which this helper checks)
            "dispatchFetch" in serverEnv
          )
            return;
          // another plugin is controlling the dev server
          if (!isRunnableDevEnvironment(serverEnv)) {
            return;
          }

          globalThis.USING_SOLID_START_DEV_SERVER = true;

          removeHtmlMiddlewares(viteDevServer);

          viteDevServer.middlewares.use(async (req, res) => {
            if (req.originalUrl) {
              req.url = req.originalUrl;
            }
            const webReq = new NodeRequest({ req, res });

            try {
              const serverEntry: Server = await serverEnv.runner.import("./src/entry-server.tsx");

              const webRes = await serverEntry.default.fetch(webReq);

              return sendNodeResponse(res, webRes);
            } catch (e: unknown) {
              console.error(e);
              viteDevServer.ssrFixStacktrace(e as Error);

              if (webReq.headers.get("content-type")?.includes("application/json")) {
                return sendNodeResponse(
                  res,
                  Response.json(
                    {
                      status: 500,
                      error: "Internal Server Error",
                      message: "An unexpected error occurred. Please try again later.",
                      timestamp: new Date().toISOString(),
                    },
                    {
                      status: 500,
                      headers: {
                        "Content-Type": "application/json",
                      },
                    },
                  ),
                );
              }

              return sendNodeResponse(
                res,
                new Response(
                  `
                    <!DOCTYPE html>
                    <html lang="en">
                      <head>
                        <meta charset="UTF-8" />
                        <title>Error</title>
                        <script type="module">
                          import { ErrorOverlay } from '/@vite/client'
                          document.body.appendChild(new ErrorOverlay(${JSON.stringify(
                            prepareError(req, e),
                          ).replace(/</g, "\\u003c")}))
                        </script>
                      </head>
                      <body>
                      </body>
                    </html>
                  `,
                  {
                    status: 500,
                    headers: { "Content-Type": "text/html" },
                  },
                ),
              );
            }
          });
        };
      },
    },
  ];
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
