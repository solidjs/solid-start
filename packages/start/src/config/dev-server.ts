import { existsSync } from "node:fs";
import type { ServerResponse } from "node:http";
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

        // Runs before the middleware that actually renders the document (ours below, or the one
        // installed by whichever plugin owns the server environment) so that it can rewrite the
        // response it produces.
        viteDevServer.middlewares.use(hmrRecoveryMiddleware);

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
 * Reloads the page once an HMR update makes the server render it again.
 *
 * Vite's client only reloads by itself when the page either has a `vite-error-overlay` mounted or
 * receives an explicit `full-reload`. An SSR error page rendered by another plugin (Nitro's, for
 * instance) has neither, and none of its modules are registered for HMR, so a plain `update` for
 * the fixed file would be dropped and the error page would stay on screen forever.
 *
 * The update is broadcast to the browser before the server environment has necessarily picked the
 * change up, so reloading straight away tends to render the same error again. Retrying briefly is
 * what makes the recovery reliable; failing quietly leaves the next update to try again.
 */
export const HMR_RECOVERY_SCRIPT = `<script type="module">
  import { createHotContext } from "/@vite/client";

  let pending = false;
  async function reloadWhenServerRecovers() {
    if (pending) return;
    pending = true;
    for (const delay of [0, 100, 200, 400, 800]) {
      await new Promise(resolve => setTimeout(resolve, delay));
      const response = await fetch(location.href, {
        cache: "no-store",
        headers: { accept: "text/html" },
      }).catch(() => null);
      if (response && response.status < 500) return location.reload();
    }
    pending = false;
  }

  const hot = createHotContext("/@solid-start/dev-error-page");
  hot.on("vite:beforeUpdate", reloadWhenServerRecovers);
  hot.on("vite:error", reloadWhenServerRecovers);
</script>`;

/**
 * Reads the content type out of `writeHead` arguments and drops `content-length` from them.
 *
 * `writeHead` sends the headers immediately, and it may carry them as an object or as a flat
 * `[name, value, ...]` array that never reaches `getHeader`, so this is the only chance to see or
 * change them. Dropping the length rather than recomputing it lets Node fall back to chunked
 * encoding, so the body can stream through untouched instead of being buffered up to measure it.
 *
 * @param args the arguments `writeHead` was called with
 * @returns the content type it announced, and a copy of the arguments without the length
 */
export function inspectWriteHead(args: Array<unknown>) {
  let contentType: string | undefined;

  const withoutContentLength = args.map((argument, index) => {
    const entries = index === 0 ? undefined : headerEntries(argument);
    if (!entries) return argument;

    const kept = entries.filter(([name, value]) => {
      const header = String(name).toLowerCase();
      if (header === "content-type") contentType ??= String(value);
      return header !== "content-length";
    });

    return Array.isArray(argument) ? kept.flat() : Object.fromEntries(kept);
  });

  return { contentType, withoutContentLength };
}

/** Both header forms `writeHead` accepts, as pairs. */
function headerEntries(argument: unknown): Array<[unknown, unknown]> | undefined {
  if (Array.isArray(argument)) {
    const pairs: Array<[unknown, unknown]> = [];
    for (let i = 0; i < argument.length - 1; i += 2) pairs.push([argument[i], argument[i + 1]]);
    return pairs;
  }

  return argument && typeof argument === "object" ? Object.entries(argument) : undefined;
}

export function isHtmlErrorResponse(status: number, contentType: unknown): boolean {
  return (
    status >= 500 &&
    typeof contentType === "string" &&
    contentType.toLowerCase().startsWith("text/html")
  );
}

/**
 * Appends {@link HMR_RECOVERY_SCRIPT} to SSR error pages. Every other response is left alone.
 */
export function hmrRecoveryMiddleware(
  req: Connect.IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
) {
  // Only documents can host the recovery script.
  if (!req.headers.accept?.includes("text/html")) return next();

  const originalWriteHead = res.writeHead.bind(res);
  const originalEnd = res.end.bind(res);
  let injecting: boolean | undefined;

  res.writeHead = function writeHead(...args: Array<any>) {
    const { contentType, withoutContentLength } = inspectWriteHead(args);
    injecting = isHtmlErrorResponse(
      typeof args[0] === "number" ? args[0] : res.statusCode,
      contentType ?? res.getHeader("content-type"),
    );

    return originalWriteHead(...((injecting ? withoutContentLength : args) as [number]));
  } as ServerResponse["writeHead"];

  res.end = function end(chunk: any, ...rest: Array<any>) {
    // A response that never called `writeHead` still has its status and headers on `res`.
    injecting ??= isHtmlErrorResponse(res.statusCode, res.getHeader("content-type"));
    if (!injecting) return originalEnd(chunk, ...rest);

    if (!res.headersSent) res.removeHeader("content-length");
    if (typeof chunk === "string" || ArrayBuffer.isView(chunk)) {
      res.write(chunk, ...(rest.filter(argument => typeof argument === "string") as []));
    }

    const callback = [chunk, ...rest].find(argument => typeof argument === "function");
    return originalEnd(HMR_RECOVERY_SCRIPT, callback as () => void);
  } as ServerResponse["end"];

  next();
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
