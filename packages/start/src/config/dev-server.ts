import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { NodeRequest, sendNodeResponse } from "srvx/node";
import {
  type Connect,
  type DevEnvironment,
  isRunnableDevEnvironment,
  normalizePath,
  type PluginOption,
  type ViteDevServer,
} from "vite";
import { debounce } from "../utils/debounce.ts";
import { VITE_ENVIRONMENTS } from "./constants.ts";
import { parseIdQuery } from "./utils.ts";

export function devServer(serverEntryPath: string, middlewarePath?: string): Array<PluginOption> {
  return [
    serverOnlyReload(serverEntryPath, middlewarePath),
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

/**
 * Reloads the browser when the server entry or the middleware changes.
 *
 * Both are server-only, so they have no module in the client graph and Vite has
 * nothing to send the browser when they change. The server picks the edit up on
 * the next request, but the page the developer is looking at keeps showing the
 * output rendered from the previous version until it is refreshed by hand.
 *
 * Only these two entries are handled: modules that also exist on the client
 * (routes, components, server functions) are left to Vite, since reloading on
 * top of a client HMR update would needlessly throw away the page's state.
 *
 * @see https://github.com/solidjs/solid-start/issues/1611
 */
export function serverOnlyReload(serverEntryPath: string, middlewarePath?: string): PluginOption {
  /**
   * Resolved the same way the runtime resolves them, so that an extensionless
   * or aliased middleware path still matches. Both are stable for the lifetime
   * of the server, so this is only done once.
   */
  let serverOnlyFiles: Promise<Set<string>> | undefined;

  /** Coalesces the reload when a save touches both entries at once */
  const reload = debounce((server: ViteDevServer) => {
    server.environments[VITE_ENVIRONMENTS.client]?.hot.send({ type: "full-reload" });
  }, 50);

  return {
    name: "solid-start-server-only-reload",
    async hotUpdate({ file, modules, server }) {
      if (this.environment.name !== VITE_ENVIRONMENTS.server) return;
      // Nothing was server rendered from this file
      if (modules.length === 0) return;

      serverOnlyFiles ??= resolveFiles(this.environment, server.config.root, [
        serverEntryPath,
        middlewarePath,
      ]);

      if ((await serverOnlyFiles).has(file)) reload(server);
    },
  };
}

async function resolveFiles(
  environment: DevEnvironment,
  root: string,
  paths: Array<string | undefined>,
): Promise<Set<string>> {
  const files = new Set<string>();

  for (const path of paths) {
    if (!path) continue;

    let resolved: string | undefined;
    try {
      resolved = (await environment.pluginContainer.resolveId(path))?.id;
    } catch {
      // Fall back to the path as written, e.g. when a plugin throws on resolve
    }
    files.add(normalizePath(parseIdQuery(resolved ?? resolve(root, path)).filename));
  }

  return files;
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
