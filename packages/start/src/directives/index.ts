import {
  createFilter,
  type EnvironmentModuleGraph,
  type FilterPattern,
  type Plugin,
  type ViteDevServer,
} from "vite";
import fg from "fast-glob";
import { compile, type CompileOptions } from "./compile.ts";
import xxHash32 from "./xxhash32.ts";

export interface ServerFunctionsFilter {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

export interface ServerFunctionsOptions {
  manifest: string;
  runtime: {
    server: string;
    client: string;
  };
  filter?: ServerFunctionsFilter;
}

const DEFAULT_INCLUDE = "src/**/*.{jsx,tsx,ts,js,mjs,cjs}";
const DEFAULT_EXCLUDE = "node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}";
const DIRECTIVE = "use server";

// Dev-only virtual module used by fns/handler.ts to lazily resolve a server
// function id back to its owning module when the function was never evaluated
// in the server environment (e.g. its route was only client-side navigated to).
const LOOKUP_ID = "solid-start:server-fn-lookup";

type Manifest = Record<CompileOptions["mode"], Set<string>>;

function createManifest(): Manifest {
  return {
    server: new Set(),
    client: new Set(),
  };
}

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

function mergeManifestRecord(
  source: Set<string>,
  target: Set<string>,
): { invalidPreload: boolean; invalidated: string[] } {
  const current = source.size;
  for (const entry of target) {
    source.add(entry);
  }
  return {
    invalidPreload: current !== source.size,
    invalidated: [...source],
  };
}

function invalidateModule(moduleGraph: EnvironmentModuleGraph, path: string) {
  const target = moduleGraph.getModuleById(path);
  if (target) {
    moduleGraph.invalidateModule(target);
  }
}

function invalidateModules(
  server: ViteDevServer | undefined,
  result: ReturnType<typeof mergeManifestRecord>,
  manifest: string,
): void {
  if (server) {
    if (result.invalidPreload) {
      // Environments are not limited to "client"/"ssr": plugins like nitro
      // render in their own environment (e.g. "nitro"), so invalidate everywhere.
      for (const environment of Object.values(server.environments)) {
        invalidateModule(environment.moduleGraph, manifest);
      }
    }
  }
}

export function serverFunctionsPlugin(options: ServerFunctionsOptions): Plugin[] {
  const filter = createFilter(
    options.filter?.include || DEFAULT_INCLUDE,
    options.filter?.exclude || DEFAULT_EXCLUDE,
  );

  let env: CompileOptions["env"];

  const manifest = createManifest();

  const preload: Record<CompileOptions["mode"], Debouncer<string> | undefined> = {
    server: undefined,
    client: undefined,
  };
  let currentServer: ViteDevServer;

  const clientOptions: Pick<CompileOptions, "directive" | "definitions"> = {
    directive: DIRECTIVE,
    definitions: {
      register: {
        kind: "named",
        name: "createServerReference",
        source: options.runtime.client,
      },
      clone: {
        kind: "named",
        name: "cloneServerReference",
        source: options.runtime.client,
      },
    },
  };
  const serverOptions: Pick<CompileOptions, "directive" | "definitions"> = {
    directive: DIRECTIVE,
    definitions: {
      register: {
        kind: "named",
        name: "createServerReference",
        source: options.runtime.server,
      },
      clone: {
        kind: "named",
        name: "cloneServerReference",
        source: options.runtime.server,
      },
    },
  };

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
        if (source === options.manifest) {
          return { id: options.manifest, moduleSideEffects: true };
        }
        if (source.startsWith(LOOKUP_ID)) {
          return { id: source, moduleSideEffects: true };
        }
        return null;
      },
      async load(id, opts) {
        const mode = opts?.ssr ? "server" : "client";
        if (id === options.manifest) {
          const current = new Debouncer(() =>
            [...manifest[mode]].map(entry => `import "${entry}";`).join("\n"),
          );
          preload[mode] = current;
          const result = await current.promise.reference;
          return result;
        }
        if (id.startsWith(LOOKUP_ID)) {
          if (this.environment.mode !== "dev") {
            throw new Error(`${LOOKUP_ID} is only available in dev`);
          }
          const functionId = new URLSearchParams(id.slice(LOOKUP_ID.length + 1)).get("id");
          // dev function ids are `${xxHash32(file)}-${count}-${name}`
          const hash = functionId?.split("-")[0];
          if (!hash) return "export {};";

          // Look through the files already discovered by the transform first;
          // fall back to scanning the project so a function is found even when
          // the browser kept a chunk from before a dev server restart.
          let files = [...manifest.server].filter(file => xxHash32(file).toString(16) === hash);
          if (files.length === 0) {
            files = fg
              .sync(DEFAULT_INCLUDE, { cwd: this.environment.config.root, absolute: true })
              .filter(file => filter(file) && xxHash32(file).toString(16) === hash);
          }
          return files.map(file => `import ${JSON.stringify(file)};`).join("\n") || "export {};";
        }
        return null;
      },
    },
    {
      name: "solid-start:server-functions/compiler",
      enforce: "pre",
      async transform(code, fileId, opts) {
        const mode = opts?.ssr ? "server" : "client";
        const [id] = fileId.split("?");
        if (!filter(id)) {
          return null;
        }

        const result = await compile(id!, code, {
          ...(mode === "server" ? serverOptions : clientOptions),
          mode,
          env,
        });

        if (result.valid) {
          const preloader = preload[mode];
          if (preloader) {
            preloader.defer();
          }
          invalidateModules(
            currentServer,
            mergeManifestRecord(manifest.server, new Set([id!])),
            options.manifest,
          );

          return {
            code: result.code || "",
            map: result.map,
          };
        }
        return null;
      },
    },
  ];
}
