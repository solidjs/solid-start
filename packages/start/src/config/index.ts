import { defu } from "defu";
import { globSync } from "node:fs";
import { extname, isAbsolute, join, relative } from "node:path";
import type { PluginOption } from "vite";
import solid, {
  devStylePatch,
  serverFunctions,
  type Options as SolidOptions,
  type ServerFunctionsOptions,
} from "vite-plugin-solid";
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
      async config(_, env) {
        const clientInput = [handlers.client];
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
            include: [
              "@solidjs/start > seroval",
              "@solidjs/start > seroval-plugins/web",
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
                  input: "~/entry-server.tsx",
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
            noExternal: ["@solidjs/start"],
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
            "import.meta.env.START_DEV_OVERLAY": JSON.stringify(start.devOverlay),
            // Inline dev script (from vite-plugin-solid) that reconciles
            // SSR'd <style data-vite-dev-id> tags with Vite's HMR client.
            "import.meta.env.START_DEV_STYLE_PATCH": JSON.stringify(devStylePatch),
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
    devServer(),
    solid({
      ...start.solid,
      ssr: true,
      extensions: extensions.map(ext => `.${ext}`),
    }),
  ];
}
