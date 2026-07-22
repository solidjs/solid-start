import { defu } from "defu";
import { globSync } from "node:fs";
import { basename, extname, isAbsolute, join, relative } from "node:path";
import type { PluginOption } from "vite";
import solid, {
  devStylePatch,
  serverFunctions,
  type Options as SolidOptions,
  type ServerFunctionsOptions,
} from "vite-plugin-solid";
import { boundaryModules } from "./boundary-modules.ts";
import { DEFAULT_EXTENSIONS, VIRTUAL_MODULES, VITE_ENVIRONMENTS } from "./constants.ts";
import { devServer } from "./dev-server.ts";
import { envPlugin, type EnvPluginOptions } from "./env.ts";
import { SolidStartClientFileRouter, SolidStartServerFileRouter } from "./fs-router.ts";
import { fsRoutes } from "./fs-routes/index.ts";
import type { BaseFileSystemRouter } from "./fs-routes/router.ts";
import { parseIdQuery } from "./utils.ts";

export interface SolidStartOptions {
  solid?: Partial<SolidOptions>;
  ssr?: boolean;
  routeDir?: string;
  extensions?: string[];
  middleware?: string;
  env?: EnvPluginOptions;
  serverFunctions?: Pick<ServerFunctionsOptions, "filter">;
}

const absolute = (path: string, root: string) =>
  path ? (isAbsolute(path) ? path : join(root, path)) : path;

const DEV_MANIFEST_REGISTRY_KEY = Symbol.for("vite-plugin-solid:dev-manifest");
const DEV_MANIFEST_ENDPOINT = "/@solid-start/dev-manifest";

export function solidStart(options?: SolidStartOptions): Array<PluginOption> {
  const start = defu(options ?? {}, {
    appRoot: "./src",
    routeDir: "./routes",
    ssr: true,
    devOverlay: true,
    experimental: {
      islands: false,
    },
    solid: {},
    extensions: [],
  });
  const extensions = [...DEFAULT_EXTENSIONS, ...(start.extensions || [])];
  const routeDir = join(start.appRoot, start.routeDir);
  const root = process.cwd();
  const appEntryPath = globSync(join(root, start.appRoot, "app.{j,t}sx"))[0];
  if (!appEntryPath) {
    throw new Error(`Could not find an app jsx/tsx entry in ${start.appRoot}.`);
  }
  const entryExtension = extname(appEntryPath);
  const handlers = {
    client: `${start.appRoot}/entry-client${entryExtension}`,
    server: `${start.appRoot}/entry-server${entryExtension}`,
  };
  return [
    {
      name: "solid-start:dev-manifest-bridge",
      apply: "serve",
      enforce: "pre",
      configureServer(server) {
        // Nitro's SSR runner is isolated from Vite's global resolver registry,
        // so expose the resolver through Vite's own dev middleware.
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url || "/", "http://localhost");
          if (url.pathname !== DEV_MANIFEST_ENDPOINT) return next();

          const key = url.searchParams.get("key");
          if (!key) {
            res.statusCode = 400;
            return res.end("Missing asset key");
          }

          try {
            const registry = (globalThis as any)[DEV_MANIFEST_REGISTRY_KEY];
            const resolver = registry?.[server.config.root];
            const assets = resolver ? await resolver.resolve(key) : null;
            res.setHeader("content-type", "application/json");
            res.setHeader("cache-control", "no-store");
            return res.end(JSON.stringify(assets));
          } catch (error) {
            return next(error);
          }
        });
      },
    },
    {
      name: "solid-start:config",
      enforce: "pre",
      configEnvironment(name) {
        return {
          resolve: {
            // remove when https://github.com/solidjs/vite-plugin-solid/pull/228 is released
            externalConditions: ["solid", "node"],
          },
        };
      },
      async config(config, env) {
        const clientInput = [handlers.client];
        const bundledDev = env.command === "serve" && !!config.experimental?.bundledDev;
        if (bundledDev) {
          console.warn(
            "[solid-start] Vite's experimental `bundledDev` mode is currently unsupported by SolidStart. " +
              "Vite does not yet provide an API to map a module id to its served URL, which SolidStart " +
              "needs to emit SSR preload and hydration hints. Until it does " +
              "(see https://github.com/vitejs/vite/issues/22991), hydration of code-split routes will fail."
          );
        }
        const clientEntryUrl = bundledDev
          ? `assets/${basename(handlers.client, entryExtension)}.js`
          : handlers.client;
        if (env.command === "build") {
          const clientRouter: BaseFileSystemRouter = (globalThis as any).ROUTERS.client;
          for (const route of await clientRouter.getRoutes()) {
            for (const [key, value] of Object.entries(route)) {
              if (value && key.startsWith("$") && !key.startsWith("$$")) {
                function toRouteId(route: any) {
                  return `${route.src}?${route.pick.map((p: string) => `pick=${p}`).join("&")}`;
                }
                clientInput.push(toRouteId(value));
              }
            }
          }
        }
        return {
          appType: "custom",
          build: { assetsDir: "_build/assets" },
          optimizeDeps: {
            include: ["@solidjs/start > seroval", "@solidjs/start > seroval-plugins/web"],
            // Suppress TS errors from Vite 7 types when configuring Vite 8's Rolldown
            ...({
              rolldownOptions: {
                transform: {
                  jsx: "react",
                },
              },
            } as any),
          },
          environments: {
            [VITE_ENVIRONMENTS.client]: {
              consumer: "client",
              build: {
                write: true,
                manifest: true,
                outDir: "dist/client",
                rollupOptions: {
                  input: clientInput,
                  treeshake: true,
                  preserveEntrySignatures: "exports-only",
                },
              },
            },
            [VITE_ENVIRONMENTS.server]: {
              consumer: "server",
              build: {
                ssr: true,
                write: true,
                manifest: true,
                copyPublicDir: false,
                rollupOptions: {
                  input: handlers.server,
                },
                outDir: "dist/server",
                commonjsOptions: {
                  include: [/node_modules/],
                },
              },
            },
          },
          resolve: {
            alias: {
              "@solidjs/start/server/entry": handlers.server,
              "~": join(process.cwd(), start.appRoot),
              ...(!start.ssr
                ? {
                    "@solidjs/start/server": "@solidjs/start/server/spa",
                    "@solidjs/start/client": "@solidjs/start/client/spa",
                  }
                : {}),
            },
            // Depending on the package manager and dependency structure Vite externalizes @solidjs/start
            // This makes sure that @solidjs/start goes through the Vite build process
            //
            // h3 and cookie-es must be bundled as well: if they stay external, the server build
            // emits bare imports that nitro later re-resolves from the project root, where package
            // managers like yarn may have hoisted the older major versions required by nitropack
            // and unstorage (h3 v1 / cookie-es v1) instead of the versions @solidjs/start needs
            // (see https://github.com/solidjs/solid-start/issues/2101
            // and https://github.com/solidjs/solid-start/issues/2178)
            noExternal: ["@solidjs/start", "h3", "cookie-es"],
          },
          define: {
            "import.meta.env.MANIFEST": `globalThis.MANIFEST`,
            "import.meta.env.START_SSR": JSON.stringify(start.ssr),
            // Root-relative (posix) so it can key manifest/resolver lookups.
            // JSON.stringify keeps the define a valid JS string literal.
            "import.meta.env.START_APP_ENTRY": JSON.stringify(
              relative(root, appEntryPath).split("\\").join("/"),
            ),
            "import.meta.env.START_CLIENT_ENTRY": JSON.stringify(handlers.client),
            "import.meta.env.START_CLIENT_ENTRY_URL": JSON.stringify(clientEntryUrl),
            "import.meta.env.START_DEV_OVERLAY": JSON.stringify(start.devOverlay),
            // Inline dev script (from vite-plugin-solid) that reconciles
            // SSR'd <style data-vite-dev-id> tags with Vite's HMR client.
            "import.meta.env.START_DEV_STYLE_PATCH": JSON.stringify(devStylePatch),
            "import.meta.env.SERVER_BASE_URL": JSON.stringify(
              (config.server as { baseURL?: string } | undefined)?.baseURL ?? "",
            ),
          },
          builder: {
            sharedPlugins: true,
            async buildApp(builder) {
              const client = builder.environments[VITE_ENVIRONMENTS.client];
              const server = builder.environments[VITE_ENVIRONMENTS.server];

              if (!client) throw new Error("Client environment not found");
              if (!server) throw new Error("SSR environment not found");

              if (!client.isBuilt) await builder.build(client);
              if (!server.isBuilt) await builder.build(server);
            },
          },
        };
      },
    },
    fsRoutes({
      routers: {
        client: new SolidStartClientFileRouter({
          dir: absolute(routeDir, root),
          extensions,
        }),
        ssr: new SolidStartServerFileRouter({
          dir: absolute(routeDir, root),
          extensions,
          dataOnly: !start.ssr,
        }),
      },
    }),
    envPlugin(options?.env),
    // Must be placed after fsRoutes, as treeShake will remove the
    // server fn exports added in by this plugin
    serverFunctions({
      manifest: VIRTUAL_MODULES.serverFnManifest,
      runtime: {
        server: "@solidjs/start/fns/server",
        client: "@solidjs/start/fns/client",
      },
      filter: options?.serverFunctions?.filter,
    }),
    boundaryModules(),
    {
      name: "solid-start:virtual-modules",
      async resolveId(id) {
        const { filename, query } = parseIdQuery(id);

        if (filename === VIRTUAL_MODULES.middleware) {
          if (start.middleware) return await this.resolve(start.middleware);
          return `\0${VIRTUAL_MODULES.middleware}`;
        }

        let base;
        if (filename === VIRTUAL_MODULES.clientEntry) base = handlers.client;
        if (filename === VIRTUAL_MODULES.serverEntry) base = handlers.server;
        if (filename === VIRTUAL_MODULES.app) base = appEntryPath;

        if (base) {
          let id = (await this.resolve(base))?.id;
          if (!id) return;

          if (query.size > 0) id += `?${query.toString()}`;
          return id;
        }
      },
      load(id) {
        if (id === `\0${VIRTUAL_MODULES.middleware}`) return "export default {};";
      },
    },
    devServer(handlers.server),
    solid({
      ...start.solid,
      ssr: true,
      extensions: extensions.map(ext => `.${ext}`),
    }),
  ];
}
