import { DevEnvironment, Rollup } from "vite";
import fs from "node:fs";
import path from "node:path";

const postfixRE = /[?#].*$/;
export function cleanUrl(url: string): string {
  return url.replace(postfixRE, "");
}

export const FS_PREFIX = `/@fs/`;

export const VALID_ID_PREFIX = `/@id/`;

export const NULL_BYTE_PLACEHOLDER = `__x00__`;
const NULL_BYTE_REGEX = /^\0/;

export function normalizeResolvedIdToUrl(
  environment: DevEnvironment,
  url: string,
  resolved: Rollup.PartialResolvedId,
): string {
  const root = environment.config.root;
  const depsOptimizer = environment.depsOptimizer;

  // normalize all imports into resolved URLs
  // e.g. `import 'foo'` -> `import '/@fs/.../node_modules/foo/index.js'`
  if (resolved.id.startsWith(withTrailingSlash(root))) {
    // in root: infer short absolute path from root
    url = resolved.id.slice(root.length);
  } else if (
    depsOptimizer?.isOptimizedDepFile(resolved.id) ||
    // vite-plugin-react isn't following the leading \0 virtual module convention.
    // This is a temporary hack to avoid expensive fs checks for React apps.
    // We'll remove this as soon we're able to fix the react plugins.
    (resolved.id !== "/@react-refresh" &&
      path.isAbsolute(resolved.id) &&
      fs.existsSync(cleanUrl(resolved.id)))
  ) {
    // an optimized deps may not yet exists in the filesystem, or
    // a regular file exists but is out of root: rewrite to absolute /@fs/ paths
    url = path.posix.join(FS_PREFIX, resolved.id);
  } else {
    url = resolved.id;
  }

  // if the resolved id is not a valid browser import specifier,
  // prefix it to make it valid. We will strip this before feeding it
  // back into the transform pipeline
  if (url[0] !== "." && url[0] !== "/") {
    url = wrapId(resolved.id);
  }

  return url;
}

/**
 * Inspired by:
 * https://github.com/withastro/astro/blob/fddde5fad81007795eb263c7fd0cea096b8e2cba/packages/astro/src/core/util.ts#L115
 * https://github.com/vitejs/vite/blob/130e7181a55c524383c63bbfb1749d0ff7185cad/packages/vite/src/shared/utils.ts#L11
 */
export function wrapId(id: string): string {
  return id.replace(NULL_BYTE_REGEX, `${VALID_ID_PREFIX}${NULL_BYTE_PLACEHOLDER}`);
}

export function unwrapId(id: string): string {
  return id.startsWith(VALID_ID_PREFIX)
    ? id.slice(VALID_ID_PREFIX.length).replace(NULL_BYTE_PLACEHOLDER, "\0")
    : id;
}

export function normalizeViteImportAnalysisUrl(environment: DevEnvironment, id: string): string {
  let url = normalizeResolvedIdToUrl(environment, id, { id });

  // https://github.com/vitejs/vite/blob/c18ce868c4d70873406e9f7d1b2d0a03264d2168/packages/vite/src/node/plugins/importAnalysis.ts#L416
  if (environment.config.consumer === "client") {
    const mod = environment.moduleGraph.getModuleById(id);
    if (mod && mod.lastHMRTimestamp > 0) {
      url = injectQuery(url, `t=${mod.lastHMRTimestamp}`);
    }
  }

  return url;
}

export function withTrailingSlash(path: string): string {
  if (path[path.length - 1] !== "/") {
    return `${path}/`;
  }
  return path;
}

export function splitFileAndPostfix(path: string): {
  file: string;
  postfix: string;
} {
  const file = cleanUrl(path);
  return { file, postfix: path.slice(file.length) };
}

const windowsSlashRE = /\\/g;
export function slash(p: string): string {
  return p.replace(windowsSlashRE, "/");
}

const isWindows = typeof process !== "undefined" && process.platform === "win32";

export function injectQuery(url: string, queryToInject: string): string {
  const { file, postfix } = splitFileAndPostfix(url);
  const normalizedFile = isWindows ? slash(file) : file;
  return `${normalizedFile}?${queryToInject}${
    postfix[0] === "?" ? `&${postfix.slice(1)}` : /* hash only */ postfix
  }`;
}
