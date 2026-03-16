import { loadEnv, type Plugin } from "vite";

export interface EnvPluginOptions {
  server?: {
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

const DEFAULT_SERVER_PREFIX = "SERVER_";
const DEFAULT_CLIENT_PREFIX = "CLIENT_";

const SERVER_ONLY_MODULE = `throw new Error('Attempt to load server-only environment variables in client runtime.');`;

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
  return {
    name: "solid-start:env",
    enforce: "pre",
    configResolved(config) {
      env = config.mode !== "production" ? "development" : "production";
    },
    resolveId(id) {
      if (id === SERVER_ENV || id === CLIENT_ENV) {
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
          : loadEnv(env, false, clientPrefix);
        return convertObjectToModule(vars);
      }
      if (id === CLIENT_ENV) {
        const vars = currentOptions.client?.load
          ? currentOptions.client.load()
          : loadEnv(env, false, serverPrefix);
        return convertObjectToModule(vars);
      }
      return null;
    },
  };
}
