import { fileURLToPath } from "node:url";
import { createFilter, type FilterPattern, normalizePath, type Plugin } from "vite";
import { compile, type CompileOptions } from "./compile.ts";

export interface ServerFunctionsFilter {
  include?: FilterPattern;
  exclude?: FilterPattern;
}

export interface ServerFunctionsOptions {
  manifest: string;
  filter?: ServerFunctionsFilter;
}

const CLIENT_PATH = normalizePath(
  fileURLToPath(new URL("../server/server-runtime.ts", import.meta.url)),
);
const SERVER_PATH = normalizePath(
  fileURLToPath(new URL("../server/server-fns-runtime.ts", import.meta.url)),
);

const DEFAULT_INCLUDE = "src/**/*.{jsx,tsx,ts,js,mjs,cjs}";
const DEFAULT_EXCLUDE = "node_modules/**/*.{jsx,tsx,ts,js,mjs,cjs}";
const DIRECTIVE = "use server";

const CLIENT_OPTIONS: Pick<CompileOptions, "directive" | "definitions"> = {
  directive: DIRECTIVE,
  definitions: {
    register: {
      kind: "named",
      name: "createServerReference",
      source: CLIENT_PATH,
    },
    clone: {
      kind: "named",
      name: "cloneServerReference",
      source: CLIENT_PATH,
    },
  },
};
const SERVER_OPTIONS: Pick<CompileOptions, "directive" | "definitions"> = {
  directive: DIRECTIVE,
  definitions: {
    register: {
      kind: "named",
      name: "createServerReference",
      source: SERVER_PATH,
    },
    clone: {
      kind: "named",
      name: "cloneServerReference",
      source: SERVER_PATH,
    },
  },
};

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

  return [
    {
      name: "solid-start:server-functions/setup",
      enforce: "pre",
      configResolved(config) {
        env = config.mode !== "production" ? "development" : "production";
      },
    },
    {
      name: "solid-start:server-functions/preload",
      enforce: "pre",
      resolveId(source) {
        if (source === options.manifest) {
          return { id: options.manifest, moduleSideEffects: true };
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
        return null;
      },
    },
    {
      name: "solid-start:server-functions/compiler",
      async transform(code, fileId, opts) {
        const mode = opts?.ssr ? "server" : "client";
        const [id] = fileId.split("?");
        if (!filter(id)) {
          return null;
        }
        const preloader = preload[mode];
        if (preloader) {
          preloader.defer();
        }

        const result = await compile(id!, code, {
          ...(mode === 'server' ? SERVER_OPTIONS : CLIENT_OPTIONS),
          mode,
          env,
        });

        if (result.valid) {
          manifest[mode].add(id!);

          return {
            code: result.code || "",
            map: result.map,
          };
        }
        return code;
      },
    },
  ];
}
