import { promises as fsp } from "node:fs";
import path, { dirname, join } from "node:path";
import { build, copyPublicAssets, createNitro, Nitro, prepare, prerender, type NitroConfig } from "nitropack";
import {
  Connect,
  EnvironmentOptions,
  isRunnableDevEnvironment,
  PluginOption,
  Rollup,
  ViteDevServer
} from "vite";
import { resolve } from "node:path";
import { createEvent, getHeader, H3Event, sendStream, sendWebResponse, setHeader, setHeaders } from "h3";

export const clientDistDir = "node_modules/.solid-start/client-dist";
export const serverDistDir = "node_modules/.solid-start/server-dist";
export const ssrEntryFile = "ssr.mjs";

export type UserNitroConfig = Omit<NitroConfig, "dev" | "publicAssets" | "renderer" | "rollupConfig">;

export function nitroPlugin(
  options: { root: string },
  getSsrBundle: () => Rollup.OutputBundle,
  nitroConfig?: UserNitroConfig
  // handlers: { client: string; server: string }
): Array<PluginOption> {
  return [
    {
      name: "solid-start-nitro-dev-server",
      configureServer(viteDevServer) {
        return () => {
          removeHtmlMiddlewares(viteDevServer);
          viteDevServer.middlewares.use(async (req, res) => {
            const event = createEvent(req, res);
            event.context.viteDevServer = viteDevServer;
            const serverEnv = viteDevServer.environments.server;
            try {
              if (!serverEnv) throw new Error("Server environment not found");
              if (!isRunnableDevEnvironment(serverEnv))
                throw new Error("Server environment is not runnable");

              const serverEntry: { default: (e: H3Event) => Promise<Response> } =
                await serverEnv.runner.import("./src/entry-server.tsx");
              const resp = await serverEntry.default(event);

              if (typeof resp === "string") {
                const html = await viteDevServer.transformIndexHtml(event.path, resp);
                sendWebResponse(event, new Response(html, { headers: { "content-type": "text/html" } }));
              }
              else if (typeof resp === "object" && "pipeTo" in resp)
                sendStream(event, resp as unknown as ReadableStream);
              else if (resp instanceof Response)
                sendWebResponse(event, resp);
            } catch (e) {
              console.error(e);
              viteDevServer.ssrFixStacktrace(e as Error);
              if (getHeader(event, "content-type")?.includes("application/json")) {
                return sendWebResponse(
                  event,
                  new Response(
                    JSON.stringify(
                      {
                        status: 500,
                        error: "Internal Server Error",
                        message: "An unexpected error occurred. Please try again later.",
                        timestamp: new Date().toISOString()
                      },
                      null,
                      2
                    ),
                    {
                      status: 500,
                      headers: {
                        "Content-Type": "application/json"
                      }
                    }
                  )
                );
              }
              return sendWebResponse(
                event,
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
                    prepareError(req, e)
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
                      "Content-Type": "text/html"
                    }
                  }
                )
              );
            }
          });
        };
      }
    },
    {
      name: "solid-start-vite-plugin-nitro",
      configEnvironment(name) {
        if (name === "server") {
          return {
            build: {
              commonjsOptions: {
                include: []
              },
              ssr: true,
              sourcemap: true,
              rollupOptions: {
                input: "~/entry-server.tsx"
              }
            }
          } satisfies EnvironmentOptions;
        }

        return null;
      },
      config() {
        return {
          builder: {
            sharedPlugins: true,
            async buildApp(builder) {
              const clientEnv = builder.environments["client"];
              const serverEnv = builder.environments["server"];

              if (!clientEnv) throw new Error("Client environment not found");
              if (!serverEnv) throw new Error("SSR environment not found");

              await builder.build(clientEnv);
              await builder.build(serverEnv);

              const resolvedNitroConfig: NitroConfig = {
                compatibilityDate: "2024-11-19",
                logLevel: 3,
                preset: "node-server",
                typescript: {
                  generateTsConfig: false
                },
                ...nitroConfig,
                dev: false,
                publicAssets: [{ dir: path.resolve(options.root, clientDistDir) }],
                renderer: ssrEntryFile,
                rollupConfig: {
                  plugins: [virtualBundlePlugin(getSsrBundle()) as any]
                },
              };

              const nitro = await createNitro(resolvedNitroConfig);

              await buildNitroEnvironment(nitro, () => build(nitro));
            }
          }
        };
      }
    }
  ];
}

export async function buildNitroEnvironment(nitro: Nitro, build: () => Promise<any>) {
  await prepare(nitro);
  await copyPublicAssets(nitro);
  await prerender(nitro);
  await build();

  const publicDir = nitro.options.output.publicDir;

  // As a part of the build process, the `.vite/` directory
  // is copied over from `node_modules/.tanstack-start/client-dist/`
  // to the `publicDir` (e.g. `.output/public/`).
  // This directory (containing the vite manifest) should not be
  // included in the final build, so we remove it here.
  const viteDir = path.resolve(publicDir, ".vite");
  if (await fsp.stat(viteDir).catch(() => false)) {
    await fsp.rm(viteDir, { recursive: true, force: true });
  }

  await nitro.close();
}

function virtualBundlePlugin(ssrBundle: Rollup.OutputBundle): PluginOption {
  type VirtualModule = { code: string; map: string | null };
  const _modules = new Map<string, VirtualModule>();

  // group chunks and source maps
  for (const [fileName, content] of Object.entries(ssrBundle)) {
    if (content.type === "chunk") {
      const virtualModule: VirtualModule = {
        code: content.code,
        map: null
      };
      const maybeMap = ssrBundle[`${fileName}.map`];
      if (maybeMap && maybeMap.type === "asset") {
        virtualModule.map = maybeMap.source as string;
      }
      _modules.set(fileName, virtualModule);
      _modules.set(resolve(fileName), virtualModule);
    }
  }

  return {
    name: "virtual-bundle",
    resolveId(id, importer) {
      if (_modules.has(id)) {
        return resolve(id);
      }

      if (importer) {
        const resolved = resolve(dirname(importer), id);
        if (_modules.has(resolved)) {
          return resolved;
        }
      }
      return null;
    },
    load(id) {
      const m = _modules.get(id);
      if (!m) {
        return null;
      }
      return m;
    }
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
    "viteSpaFallbackMiddleware"
  ];
  for (let i = server.middlewares.stack.length - 1; i > 0; i--) {
    if (
      html_middlewares.includes(
        // @ts-expect-error
        server.middlewares.stack[i].handle.name
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
    message: `An error occured while server rendering ${req.url}:\n\n\t${typeof e === "string" ? e : e.message
      } `,
    stack: typeof e === "string" ? "" : e.stack
  };
}
