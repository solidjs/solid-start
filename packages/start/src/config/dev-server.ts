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
const HMR_RECOVERY_SCRIPT = `<script type="module">
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
 * Appends {@link HMR_RECOVERY_SCRIPT} to an SSR error page so that it recovers on the next update.
 *
 * @param html the error page rendered by the server
 * @returns the error page, unchanged when it already talks to the HMR client
 */
export function injectHmrRecovery(html: string): string {
  if (html.includes("/@vite/client")) return html;

  for (const closingTag of ["</head>", "</body>", "</html>"]) {
    const index = html.lastIndexOf(closingTag);
    if (index !== -1) {
      return html.slice(0, index) + HMR_RECOVERY_SCRIPT + html.slice(index);
    }
  }

  return html + HMR_RECOVERY_SCRIPT;
}

/**
 * Reads a header out of the arguments given to `writeHead`, which may carry them as an object or as
 * a flat `[name, value, ...]` array. They are only applied to the response once the headers flush,
 * so they have to be read from here while the flush is still deferred.
 */
export function headerFromWriteHead(args: Array<unknown>, name: string): string | undefined {
  for (const argument of args.slice(1)) {
    if (Array.isArray(argument)) {
      for (let i = 0; i < argument.length - 1; i += 2) {
        if (String(argument[i]).toLowerCase() === name) return String(argument[i + 1]);
      }
    } else if (argument && typeof argument === "object") {
      for (const [key, value] of Object.entries(argument)) {
        if (key.toLowerCase() === name) return String(value);
      }
    }
  }

  return undefined;
}

/**
 * Strips `content-length` from `writeHead` arguments so the rewritten body can set its own.
 *
 * @param args the arguments `writeHead` was called with
 * @returns a copy of them, with the header removed from whichever form it was given in
 */
export function withoutContentLength(args: Array<unknown>): Array<unknown> {
  return args.map((argument, index) => {
    if (index === 0) return argument;

    if (Array.isArray(argument)) {
      const kept: Array<unknown> = [];
      for (let i = 0; i < argument.length - 1; i += 2) {
        if (String(argument[i]).toLowerCase() !== "content-length") {
          kept.push(argument[i], argument[i + 1]);
        }
      }
      return kept;
    }

    if (argument && typeof argument === "object") {
      return Object.fromEntries(
        Object.entries(argument).filter(([key]) => key.toLowerCase() !== "content-length"),
      );
    }

    return argument;
  });
}

export function isHtmlErrorResponse(status: number, contentType: unknown): boolean {
  return (
    status >= 500 &&
    typeof contentType === "string" &&
    contentType.toLowerCase().startsWith("text/html")
  );
}

/**
 * Buffers HTML error pages so {@link injectHmrRecovery} can rewrite them before they are flushed.
 *
 * Anything that is not an HTML 5xx passes straight through untouched: the decision is made from the
 * status and content type, which are known by the time the body is first written.
 */
export function hmrRecoveryMiddleware(
  req: Connect.IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
) {
  // Only documents can host the recovery script, and this keeps assets out of the buffer.
  if (!req.headers.accept?.includes("text/html")) return next();

  const originalWriteHead = res.writeHead.bind(res);
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  let intercepting: boolean | undefined;
  let pendingWriteHead: Array<any> | undefined;
  const chunks: Array<Buffer> = [];

  /** Hands the response back untouched, flushing whatever was buffered before giving up. */
  function stopIntercepting() {
    intercepting = false;
    res.writeHead = originalWriteHead;
    res.write = originalWrite;
    res.end = originalEnd;

    if (pendingWriteHead) originalWriteHead(...(pendingWriteHead as [number]));
    for (const chunk of chunks) originalWrite(chunk);
    pendingWriteHead = undefined;
    chunks.length = 0;
  }

  /**
   * The status and content type are known by the time the headers are sent, so the first call
   * decides for the whole response. A body we cannot concatenate ends interception rather than
   * corrupt it.
   *
   * @param body the chunk about to be written, when there is one
   * @param writeHeadArgs headers still pending a flush, which win over the ones set on `res`
   */
  function shouldIntercept(body?: unknown, writeHeadArgs?: Array<unknown>): boolean {
    intercepting ??= isHtmlErrorResponse(
      typeof writeHeadArgs?.[0] === "number" ? writeHeadArgs[0] : res.statusCode,
      (writeHeadArgs && headerFromWriteHead(writeHeadArgs, "content-type")) ??
        res.getHeader("content-type"),
    );
    if (!intercepting || (body !== undefined && !isWritableBody(body))) stopIntercepting();

    return intercepting;
  }

  // `writeHead` flushes the headers, which has to wait until the rewritten length is known.
  res.writeHead = function writeHead(...args: Array<any>) {
    if (!shouldIntercept(undefined, args)) return originalWriteHead(...(args as [number]));

    pendingWriteHead = args;
    return res;
  } as ServerResponse["writeHead"];

  res.write = function write(chunk: any, ...rest: Array<any>) {
    if (!shouldIntercept(chunk)) return originalWrite(chunk, ...rest);

    chunks.push(toBuffer(chunk, rest));
    callbackOf(rest)?.();
    return true;
  } as ServerResponse["write"];

  res.end = function end(chunk: any, ...rest: Array<any>) {
    const body = isWritableBody(chunk) ? chunk : undefined;
    if (!shouldIntercept(body)) return originalEnd(chunk, ...rest);

    if (body !== undefined) chunks.push(toBuffer(body, rest));

    const html = injectHmrRecovery(Buffer.concat(chunks).toString("utf8"));
    const rewritten = Buffer.from(html, "utf8");

    res.setHeader("content-length", rewritten.byteLength);
    if (pendingWriteHead) {
      // Headers passed to `writeHead` win over `setHeader`, so the stale length goes out with them
      // unless it is removed here first.
      originalWriteHead(...(withoutContentLength(pendingWriteHead) as [number]));
    }

    return originalEnd(rewritten, callbackOf([chunk, ...rest]));
  } as ServerResponse["end"];

  next();
}

/** Web stream bodies reach `write` as `Uint8Array`s rather than as Node buffers. */
function isWritableBody(body: unknown): body is string | ArrayBufferView {
  return typeof body === "string" || ArrayBuffer.isView(body);
}

function toBuffer(body: string | ArrayBufferView, rest: Array<unknown>): Buffer {
  if (typeof body !== "string") {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }

  const encoding = rest.find(argument => typeof argument === "string") as
    | BufferEncoding
    | undefined;
  return Buffer.from(body, encoding ?? "utf8");
}

function callbackOf(args: Array<unknown>): (() => void) | undefined {
  return args.find(argument => typeof argument === "function") as (() => void) | undefined;
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
