import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { NodeRequest, sendNodeResponse } from "srvx/node";
import {
  type Connect,
  isRunnableDevEnvironment,
  type PluginOption,
  type ViteDevServer,
} from "vite";
import { VITE_ENVIRONMENTS } from "./constants.ts";

export function devServer(serverEntryPath: string): Array<PluginOption> {
  return [
    {
      name: "solid-start-dev-server",
      configurePreviewServer(server) {
        const serverEntryUrl = pathToFileURL(resolvePreviewServerEntry(server.config.root)).href;

        return () => {
          server.middlewares.use(async (req, res) => {
            const webReq = new NodeRequest({ req, res });
            const def: {
              default: { fetch: (req: Request) => Promise<Response> };
            } = await import(serverEntryUrl);
            const webRes = await def.default.fetch(webReq);
            if (isHtmlResponse(webRes)) {
              res.setHeader("content-encoding", "identity");
            }
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
              const serverEntry: {
                default: { fetch: (req: Request) => Promise<Response> };
              } = await serverEnv.runner.import(serverEntryPath);

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

export function resolvePreviewServerEntry(root: string): string {
  const serverDirectory = join(root, "dist/server");
  const serverEntry = ["js", "mjs"]
    .map(extension => join(serverDirectory, `entry-server.${extension}`))
    .find(existsSync);

  if (!serverEntry) {
    throw new Error(`Could not find the SolidStart server entry in ${serverDirectory}`);
  }

  return serverEntry;
}

export function isHtmlResponse(response: Response): boolean {
  return response.headers.get("content-type")?.startsWith("text/html") ?? false;
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
