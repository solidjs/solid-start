import { loadEnv, type Plugin } from "vite";

const LOADERS = {
  node: `export default key => process.env[key];`,
  "cloudflare-workers": `import { env } from 'cloudflare:workers';export default key => env[key];`,
  "netlify-edge": `export default key => Netlify.env.get(key);`,
};

export interface EnvPluginOptions {
  server?: {
    runtime: keyof typeof LOADERS | (string & {});
    load?: () => Record<string, string>;
    prefix?: string;
  };
  client?: {
    load?: () => Record<string, string>;
    prefix?: string;
  };
}

const SERVER_ENV = "env:server";
const CLIENT_ENV = "env:client";

const SERVER_RUNTIME_ENV = `${SERVER_ENV}/runtime`;

const SERVER_RUNTIME_LOADER = `${SERVER_RUNTIME_ENV}/loader`;

const DEFAULT_SERVER_PREFIX = "SERVER_";
const DEFAULT_CLIENT_PREFIX = "CLIENT_";

const SERVER_ONLY_MODULE = `throw new Error('Attempt to load server-only environment variables in client runtime.');`;

const SERVER_RUNTIME_CODE = `import load from '${SERVER_RUNTIME_LOADER}';

export default new Proxy({}, {
  get(_, key) {
    return load(key);
  },
})`;

function convertObjectToModule(object: Record<string, string>): string {
  let result = "";
  for (const key in object) {
    result += `export const ${key} = ${JSON.stringify(object[key])};`;
  }
  return result;
}

export function envPlugin(options?: EnvPluginOptions): Plugin {
  const currentOptions = options ?? {};
  let env: string;
  const serverPrefix = currentOptions.server?.prefix ?? DEFAULT_SERVER_PREFIX;
  const clientPrefix = currentOptions.client?.prefix ?? DEFAULT_CLIENT_PREFIX;
  const runtime = options?.server?.runtime ?? "node";
  const runtimeCode = runtime in LOADERS ? LOADERS[runtime as keyof typeof LOADERS] : runtime;

  return {
    name: "solid-start:env",
    enforce: "pre",
    configResolved(config) {
      env = config.mode !== "production" ? "development" : "production";
    },
    resolveId(id) {
      if (
        id === SERVER_ENV ||
        id === CLIENT_ENV ||
        id === SERVER_RUNTIME_ENV ||
        SERVER_RUNTIME_LOADER
      ) {
        return id;
      }
      return null;
    },
    load(id, opts) {
      if (id === SERVER_ENV) {
        if (!opts?.ssr) {
          return SERVER_ONLY_MODULE;
        }
        const vars = currentOptions.server?.load
          ? currentOptions.server.load()
          : loadEnv(env, false, serverPrefix);
        return convertObjectToModule(vars);
      }
      if (id === CLIENT_ENV) {
        const vars = currentOptions.client?.load
          ? currentOptions.client.load()
          : loadEnv(env, false, clientPrefix);
        return convertObjectToModule(vars);
      }
      if (id === SERVER_RUNTIME_LOADER) {
        if (!opts?.ssr) {
          return SERVER_ONLY_MODULE;
        }
        return runtimeCode;
      }
      if (id === SERVER_RUNTIME_ENV) {
        if (!opts?.ssr) {
          return SERVER_ONLY_MODULE;
        }
        return SERVER_RUNTIME_CODE;
      }
      return null;
    },
  };
}
