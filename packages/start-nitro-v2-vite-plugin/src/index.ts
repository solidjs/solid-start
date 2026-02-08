import {
  build,
  copyPublicAssets,
  createNitro,
  type Nitro,
  type NitroConfig,
  prepare,
  prerender,
} from "nitropack";
import { promises as fsp } from "node:fs";
import path, { dirname, resolve } from "node:path";
import type { PluginOption, Rollup } from "vite";

let ssrBundle: Rollup.OutputBundle;
let ssrEntryFile: string;

export type UserNitroConfig = Omit<NitroConfig, "dev" | "publicAssets" | "renderer">;

export function nitroV2Plugin(nitroConfig?: UserNitroConfig): PluginOption {
  return [
    {
      name: "solid-start-vite-plugin-nitro",
      generateBundle: {
        handler(_options, bundle) {
          if (this.environment.name !== "ssr") {
            return;
          }

          // find entry point of ssr bundle
          let entryFile: string | undefined;
          for (const [_name, file] of Object.entries(bundle)) {
            if (file.type === "chunk") {
              if (file.isEntry) {
                if (entryFile !== undefined) {
                  this.error(
                    `Multiple entry points found for service "${this.environment.name}". Only one entry point is allowed.`,
                  );
                }
                entryFile = file.fileName;
              }
            }
          }
          if (entryFile === undefined) {
            this.error(`No entry point found for service "${this.environment.name}".`);
          }
          ssrEntryFile = entryFile!;
          ssrBundle = bundle;
        },
      },
      config() {
        return {
          environments: {
            ssr: {
              consumer: "server",
              build: {
                commonjsOptions: {
                  include: [],
                },
                ssr: true,
                sourcemap: true,
              },
            },
          },
          builder: {
            sharedPlugins: true,
            async buildApp(builder) {
              const client = builder.environments.client;
              const server = builder.environments.ssr;

              if (!client) throw new Error("Client environment not found");
              if (!server) throw new Error("SSR environment not found");

              await builder.build(client);
              await builder.build(server);

              const virtualEntry = "#solid-start/entry";
              const resolvedNitroConfig: NitroConfig = {
                compatibilityDate: "2024-11-19",
                logLevel: 3,
                preset: "node-server",
                typescript: {
                  generateTsConfig: false,
                  generateRuntimeConfigTypes: false,
                },
                ...nitroConfig,
                dev: false,
                routeRules: {
                  "/_build/assets/**": {
                    headers: {
                      "cache-control": "public, immutable, max-age=31536000",
                    },
                  },
                },
                publicAssets: [
                  {
                    dir: client.config.build.outDir,
                    maxAge: 31536000, // 1 year
                    baseURL: "/",
                  },
                ],
                noExternals: false,
                renderer: virtualEntry,
                rollupConfig: {
                  ...nitroConfig?.rollupConfig,
                  plugins: [virtualBundlePlugin(ssrBundle) as any],
                },
                experimental: {
                  ...nitroConfig?.experimental,
                  asyncContext: true,
                },
                virtual: {
                  ...nitroConfig?.virtual,
                  [virtualEntry]: `import { fromWebHandler } from 'h3'
                                  import handler from '${ssrEntryFile}'
                                  export default fromWebHandler(handler.fetch)`,
                },
              };

              const nitro = await createNitro(resolvedNitroConfig);

              await buildNitroEnvironment(nitro, () => build(nitro));
            },
          },
        };
      },
    },
    {
      name: "solid-start-nitro-edge-fix",
      enforce: "post",
      async config() {
        await fsp.rm(".solid-start", { recursive: true, force: true });
        return {
          environments: {
            client: { build: { outDir: ".solid-start/client" } },
            ssr: {
              build: nitroConfig?.preset?.toLowerCase().includes("static")
                ? undefined
                : { outDir: ".solid-start/server" },
            },
          },
        };
      },
    },
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
        map: null,
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
    },
  };
}
