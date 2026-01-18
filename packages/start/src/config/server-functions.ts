import * as dismantle from "dismantle";
import { fileURLToPath } from "node:url";
import {
  createFilter,
  normalizePath,
  type FilterPattern,
  type Plugin,
  type ViteDevServer,
} from "vite";

type CompileOptions = Pick<dismantle.Options, "mode" | "env">;

type CompileOutput = dismantle.Output;

const CLIENT = normalizePath(fileURLToPath(new URL("../fns/client", import.meta.url)));
const SERVER = normalizePath(fileURLToPath(new URL("../fns/server", import.meta.url)));
const RUNTIME = normalizePath(fileURLToPath(new URL("../fns/runtime", import.meta.url)));

async function compile(
  id: string,
  code: string,
  options: CompileOptions,
): Promise<CompileOutput> {
  return await dismantle.compile(id, code, {
    runtime: RUNTIME,
    key: "solid-start",
    mode: options.mode,
    env: options.env,
    definitions: [
      {
        type: "function-directive",
        directive: "use server",
        pure: true,
        // Where to instanciate the handlers
        target: {
          kind: "named",
          name: "createServerReference",
          source:
            options.mode === "client"
              ? CLIENT
              : SERVER,
        },
        /**
         * A resolver for the replaced functions
         *
         * dismantle will output something like this:
         * const foo = handler(async () => {
         *   const mod = (await import(modulePath)).default;
         *   return (...args) => {
         *     // ...
         *   };
         * });
         */
        handle: {
          kind: "named",
          name: "createServerFunction",
          source:
            options.mode === "client"
              ? CLIENT
              : SERVER,
        },
        // isomorphic: true,
      },
    ],
  });
}

interface ManifestRecord {
  files: CompileOutput["files"];
  entries: Set<string>;
}

type Manifest = Record<CompileOptions["mode"], ManifestRecord>;

function createManifest(): Manifest {
  return {
    server: {
      files: new Map(),
      entries: new Set(),
    },
    client: {
      files: new Map(),
      entries: new Set(),
    },
  };
}

function mergeManifestRecord(
  source: ManifestRecord,
  target: ManifestRecord,
): { invalidePreload: boolean; invalidated: string[] } {
  const invalidated: string[] = [];
  for (const [file, content] of target.files) {
    if (source.files.has(file)) {
      invalidated.push(file);
    }
    source.files.set(file, content);
  }

  const current = source.entries.size;
  for (const entry of target.entries) {
    source.entries.add(entry);
  }
  return {
    invalidePreload: current !== source.entries.size,
    invalidated,
  };
}

export interface ServerFunctionsFilter {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

export interface ServerFunctionsOptions {
  filter?: ServerFunctionsFilter;
}

const DEFAULT_INCLUDE = "src/**/*.{jsx,tsx,ts,js,mjs,cjs}";
const DEFAULT_EXCLUDE = "node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}";

const VIRTUAL_MODULE = "solid-start/fns/preload";

interface DeferredPromise<T> {
  reference: Promise<T>;
  resolve: (value: T) => void;
  reject: (value: any) => void;
}

function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolve: DeferredPromise<T>["resolve"];
  let reject: DeferredPromise<T>["reject"];

  return {
    reference: new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }),
    resolve(value) {
      resolve(value);
    },
    reject(value) {
      reject(value);
    },
  };
}

class Debouncer<T> {
  promise: DeferredPromise<T>;

  private timeout: ReturnType<typeof setTimeout> | undefined;

  constructor(private source: () => T) {
    this.promise = createDeferredPromise();
    this.defer();
  }

  defer(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    this.timeout = setTimeout(() => {
      this.promise.resolve(this.source());
    }, 1000);
  }
}

function invalidateModules(
  server: ViteDevServer | undefined,
  result: ReturnType<typeof mergeManifestRecord>,
): void {
  if (server) {
    for (let i = 0, len = result.invalidated.length; i < len; i++) {
      const invalidated = result.invalidated[i];
      if (invalidated) {
        const target = server.moduleGraph.getModuleById(invalidated);
        if (target) {
          server.moduleGraph.invalidateModule(target);
        }
      }
    }
    if (result.invalidePreload) {
      const target = server.moduleGraph.getModuleById(VIRTUAL_MODULE);
      if (target) {
        server.moduleGraph.invalidateModule(target);
      }
    }
  }
}

export function serverFunctionsPlugin(
  options: ServerFunctionsOptions,
): Plugin[] {
  const filter = createFilter(
    options.filter?.include || DEFAULT_INCLUDE,
    options.filter?.exclude || DEFAULT_EXCLUDE,
  );

  let env: CompileOptions["env"];

  const manifest = createManifest();

  const preload: Record<
    CompileOptions["mode"],
    Debouncer<string> | undefined
  > = {
    server: undefined,
    client: undefined,
  };

  let currentServer: ViteDevServer;

  return [
    {
      name: "solid-start:server-functions/setup",
      enforce: "pre",
      configResolved(config) {
        env = config.mode !== "production" ? "development" : "production";
      },
      configureServer(server) {
        currentServer = server;
      },
    },
    {
      name: "solid-start:server-functions/preload",
      enforce: "pre",
      resolveId(source) {
        if (source === VIRTUAL_MODULE) {
          return { id: VIRTUAL_MODULE, moduleSideEffects: true };
        }
        return null;
      },
      async load(id, opts) {
        const mode = opts?.ssr ? 'server' : 'client';
        if (id === VIRTUAL_MODULE) {
          const current = new Debouncer(() =>
            [...manifest[mode].entries]
              .map(entry => `import "${entry}";`)
              .join('\n'),
          );
          preload[mode] = current;
          const result = await current.promise.reference;
          return result;
        }
        return null;
      },
    },
    {
      name: "solid-start:server-functions/virtuals",
      enforce: "pre",
      async resolveId(source, importer, opts) {
        if (importer) {
          const result = await this.resolve(source, importer, opts);
          const mode = opts?.ssr ? 'server' : 'client';
          if (result && manifest[mode].files.has(result.id)) {
            return result;
          }
        }
        return null;
      },
      load(id, opts) {
        const mode = opts?.ssr ? 'server' : 'client';
        const result = manifest[mode].files.get(id);
        if (result) {
          return {
            code: result.code || '',
            map: result.map,
          };
        }
        return null;
      },
    },
    {
      name: "solid-start:server-functions/compiler",
      async transform(code, fileId, opts) {
        const mode = opts?.ssr ? 'server' : 'client';
        const [id] = fileId.split('?');
        if (!filter(id)) {
          return null;
        }
        const clientPreloader = preload[mode];
        if (clientPreloader) {
          clientPreloader.defer();
        }
        const clientResult = await compile(id!, code, {
          ...options,
          mode: 'client',
          env,
        });
        invalidateModules(
          currentServer,
          mergeManifestRecord(manifest.client, {
            files: clientResult.files,
            entries: new Set(clientResult.entries),
          }),
        );
        const serverResult = await compile(id!, code, {
          ...options,
          mode: 'server',
          env,
        });
        invalidateModules(
          currentServer,
          mergeManifestRecord(manifest.server, {
            files: serverResult.files,
            entries: new Set(serverResult.entries),
          }),
        );

        const result = opts?.ssr ? serverResult : clientResult;

        return {
          code: result.code || '',
          map: result.map,
        };
      },
    },
  ];
}
