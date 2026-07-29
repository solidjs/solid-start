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
import { appRootAlias } from "./app-root-alias.ts";
import { boundaryModules } from "./boundary-modules.ts";
import { VIRTUAL_MODULES, VITE_ENVIRONMENTS } from "./constants.ts";
import { devServer } from "./dev-server.ts";
import { envPlugin, type EnvPluginOptions } from "./env.ts";
import { PageFileSystemRouter } from "filesystem-routing";
import { DEFAULT_EXTENSIONS, fileRoutes } from "filesystem-routing/vite";
import { parseIdQuery } from "./utils.ts";

/**
 * Configuration options for SolidStart. (previously in `app.config.ts`)
 *
 * @see https://docs.solidjs.com/solid-start/v2/migrating-from-v1#move-framework-configuration-into-viteconfigts
 */
export interface SolidStartOptions {
  /**
   * Path to the root of the application (where `app.tsx` / `app.jsx` lives).
   *
   * @default "./src"
   */
  appRoot?: string;

  /**
   * Options forwarded to `vite-plugin-solid`.
   *
   * @see https://github.com/solidjs/vite-plugin-solid#api
   */
  solid?: Partial<SolidOptions>;

  /**
   * Enable or disable server-side rendering.
   *
   * - `true` — SSR (default)
   * - `false` — client-side rendering only (SPA mode)
   *
   * @default true
   */
  ssr?: boolean;

  /**
   * Show the SolidStart development overlay (error overlay, etc.) in development.
   *
   * @default true
   */
  devOverlay?: boolean;

  /**
   * Experimental features.
   */
  experimental?: {
    /**
     * Enable islands architecture mode.
     *
     * Currently fixed to `false` (not yet fully supported).
     *
     * @default false
     */
    islands?: false;
  };

  /**
   * Directory containing file-system routes, relative to {@link appRoot}.
   *
   * @default "./routes"
   */
  routeDir?: string;

  /**
   * File extensions that should be treated as routes.
   *
   * @default ["js", "jsx", "ts", "tsx"]
   */
  extensions?: string[];

  /**
   * Path to an optional middleware module.
   *
   * The module should export a middleware created with `createMiddleware`
   * from `@solidjs/start/middleware`.
   *
   * @example "src/middleware/index.ts"
   */
  middleware?: string;

  /**
   * Serialization settings for server-function / action payloads
   * that cross the server-client boundary.
   */
  serialization?: {
    /**
     * Path to a module whose default export is an array of custom Seroval
     * plugins, used to serialize values Seroval doesn't understand natively
     * (ORM id types, decimals, `Temporal`, and other custom classes).
     *
     * Build plugins with `createPlugin` from `@solidjs/start/serialization`.
     * The module is bundled into both the client and the server so that both
     * ends of a server function agree on the format, so it must not import
     * server-only code.
     *
     * Custom plugins are consulted ahead of the built-in web plugins: Seroval
     * uses the first plugin whose `test()` passes.
     *
     * Only applies to server-function and action payloads. The SSR hydration
     * payload is serialized by `solid-js/web` and is unaffected.
     *
     * @example "src/seroval-plugins.ts"
     */
    plugins?: string;
  };

  /**
   * Configures plugin behavior per build environment
   */
  env?: EnvPluginOptions;

  /**
   * Options controlling which files are processed as server functions
   * (inclusion / exclusion filters for the `"use server"` transform).
   */
  serverFunctions?: Pick<ServerFunctionsOptions, "filter"> & {
    /**
     * Path to a module whose default export is called with whatever a server
     * function threw, before it is serialized into the response. Return a
     * value to send it in place of what was thrown, or `undefined` to send the
     * original.
     *
     * Naming the module here rather than registering a handler at runtime
     * keeps the app in sole control of it: no dependency can reach into the
     * running server and take over reporting.
     *
     * The module is bundled into the server only, so it may import server-only
     * code such as a monitoring SDK.
     *
     * @example "src/server-fn-error.ts"
     */
    onError?: string;
  };
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
  } satisfies SolidStartOptions);
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
  const routers = {
    // The browser routes and renders pages.
    [VITE_ENVIRONMENTS.client]: new PageFileSystemRouter({
      dir: absolute(routeDir, root),
      extensions,
    }),
    // The server additionally serves `GET`/`POST` exports as request
    // handlers, and in SPA mode routes without ever rendering, so page
    // modules stay out of the server bundle.
    [VITE_ENVIRONMENTS.server]: new PageFileSystemRouter({
      dir: absolute(routeDir, root),
      extensions,
      httpMethods: true,
      components: start.ssr,
    }),
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
            if (!resolver) {
              console.error(
                `[solid-start] vite-plugin-solid's dev manifest registry has no resolver for root "${server.config.root}" ` +
                  `(requested asset key "${key}"). The module's client assets cannot be resolved and hydration ` +
                  "will fail for it. Typical causes: the dev server was not restarted after dependency changes, " +
                  "or the install is stale.",
              );
            }
            const assets = resolver ? await resolver.resolve(key) : null;
            if (resolver && assets == null) {
              console.error(
                `[solid-start] Dev manifest resolver returned no assets for key "${key}" (root "${server.config.root}"). ` +
                  "The module's hydration preload entry will be missing.",
              );
            }
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
        // The route modules are added to this input by the file-routes
        // plugin, which owns the ids they are loaded from.
        const clientInput = [handlers.client];
        const bundledDev = env.command === "serve" && !!config.experimental?.bundledDev;
        if (bundledDev) {
          console.warn(
            "[solid-start] Vite's experimental `bundledDev` mode is currently unsupported by SolidStart. " +
              "Vite does not yet provide an API to map a module id to its served URL, which SolidStart " +
              "needs to emit SSR preload and hydration hints. Until it does " +
              "(see https://github.com/vitejs/vite/issues/22991), hydration of code-split routes will fail.",
          );
        }
        const clientEntryUrl = bundledDev
          ? `assets/${basename(handlers.client, entryExtension)}.js`
          : handlers.client;
        return {
          appType: "custom",
          build: { assetsDir: "_build/assets" },
          optimizeDeps: {
            include: [
              "@solidjs/start > seroval",
              "@solidjs/start > seroval-plugins/web",
              // Pre-bundle both specifiers of the server-function transport in
              // the same optimizer pass so they share one module instance.
              // @solidjs/router (served as source) imports the core entry;
              // Start's fns/client imports the /client entry. Both resolve to
              // the same file, but if the router's import falls through to a
              // raw /@fs URL it gets its own copy of the transport config, and
              // configureServerFunctionsClient (endpoint, codec plugins, dev
              // hooks) never applies to router-initiated calls.
              "@solidjs/web/server-functions",
              "@solidjs/web/server-functions/client",
            ],
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
    appRootAlias(root, start.appRoot),
    fileRoutes({ routers, buildInputs: VITE_ENVIRONMENTS.client }),
    envPlugin(options?.env),
    // Must be placed after fileRoutes, as treeShake will remove the
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

        if (filename === VIRTUAL_MODULES.serverFnErrorHandler) {
          const onError = options?.serverFunctions?.onError;
          if (onError) return await this.resolve(onError);
          return `\0${VIRTUAL_MODULES.serverFnErrorHandler}`;
        }

        if (filename === VIRTUAL_MODULES.serovalPlugins) {
          const plugins = options?.serialization?.plugins;
          if (plugins) return await this.resolve(plugins);
          return `\0${VIRTUAL_MODULES.serovalPlugins}`;
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
        if (id === `\0${VIRTUAL_MODULES.serverFnErrorHandler}`) return "export default undefined;";
        if (id === `\0${VIRTUAL_MODULES.serovalPlugins}`) return "export default [];";
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
