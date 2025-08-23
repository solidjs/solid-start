import path from "node:path";
import { join, resolve } from "pathe";
import type { ModuleNode, ViteDevServer } from "vite";

import { CLIENT_BASE_PATH } from "../config/index.js";

async function getViteModuleNode(vite: ViteDevServer, file: string, ssr = false) {
  let nodePath = file;
  let node = vite.moduleGraph.getModuleById(file);

  if (!node) {
    const resolvedId = await vite.pluginContainer.resolveId(file, undefined, { ssr: false })
    if (!resolvedId) return;

    nodePath = resolvedId.id;
    node = vite.moduleGraph.getModuleById(file);
  }

  if (!node) {
    nodePath = resolve(nodePath);
    node = await vite.moduleGraph.getModuleByUrl(file);
  }

  if (!node) {
    await vite.moduleGraph.ensureEntryFromUrl(nodePath, false);
    node = vite.moduleGraph.getModuleById(nodePath);
  }


  try {
    if (!node?.transformResult && !ssr) {
      await vite.transformRequest(nodePath);
      node = vite.moduleGraph.getModuleById(nodePath);
    }

    if (ssr && !node?.ssrTransformResult) {
      // if (skip.includes(file)) {
      //   return null;
      // }
      await vite.ssrLoadModule(file);
      node = vite.moduleGraph.getModuleById(nodePath);
    }

    // vite.config.logger.error = prev;
    return node;
  } catch (e) {
    // vite.config.logger.error = prev;
    return null;
  }
}

async function findModuleDependencies(vite: ViteDevServer, module: ModuleNode, ssr = false, deps: Set<ModuleNode>) {
  async function add(module: ModuleNode) {
    if (!deps.has(module)) {
      deps.add(module);
      await findModuleDependencies(vite, module, ssr, deps);
    }
  }

  async function addByUrl(url: string, ssr: boolean) {
    const node = await getViteModuleNode(vite, url, ssr);

    if (node) await add(node);
  }

  if (module.url.endsWith(".css")) return;

  if (ssr) {
    if (module.ssrTransformResult?.deps) {
      for (const url of module.ssrTransformResult.deps) {
        await addByUrl(url, ssr);
      }

      // Parallel version with incorrect style order
      /* node.ssrTransformResult.deps.forEach((url) =>
        branches.push(add_by_url(url, ssr)),
      ); */
    }
  } else {
    for (const { url } of module.importedModules) {
      const node = await getViteModuleNode(vite, url, ssr);

      if (node && !deps.has(node)) {
        deps.add(node);
        await findModuleDependencies(vite, node, ssr, deps);
      }
    }
  }
}


// Vite doesn't expose these so we just copy the list for now
// https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/constants.ts#L49C23-L50
const cssFileRegExp =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
// https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/plugins/css.ts#L160
const cssModulesRegExp = new RegExp(`\\.module${cssFileRegExp.source}`);

const isCssFile = (file: string) => cssFileRegExp.test(file);
export const isCssModulesFile = (file: string) =>
  cssModulesRegExp.test(file);

// https://github.com/remix-run/remix/blob/65326e39099f3b2285d83aecfe734ba35f668396/packages/remix-dev/vite/styles.ts#L29
const cssUrlParamsWithoutSideEffects = ["url", "inline", "raw", "inline-css"];
export const isCssUrlWithoutSideEffects = (url: string) => {
  const queryString = url.split("?")[1];

  if (!queryString) {
    return false;
  }

  const params = new URLSearchParams(queryString);
  for (let paramWithoutSideEffects of cssUrlParamsWithoutSideEffects) {
    if (
      // Parameter is blank and not explicitly set, i.e. "?url", not "?url="
      params.get(paramWithoutSideEffects) === "" &&
      !url.includes(`?${paramWithoutSideEffects}=`) &&
      !url.includes(`&${paramWithoutSideEffects}=`)
    ) {
      return true;
    }
  }

  return false;
};

async function findFilesDepedencies(vite: ViteDevServer, files: Array<string>, ssr = false, deps = new Set<ModuleNode>()) {
  for (const file of files) {
    try {
      const node = await getViteModuleNode(vite, file, ssr);
      if (node) await findModuleDependencies(vite, node, ssr, deps);
    } catch (e) {
      console.error(e);
    }
  }

  return deps;
}

const injectQuery = (url: string, query: string) =>
  url.includes("?") ? url.replace("?", `?${query}&`) : `${url}?${query}`;

export async function findStylesInModuleGraph(vite: ViteDevServer, id: string, ssr = false) {
  const absolute = path.resolve(process.cwd(), id);

  const dependencies = await findFilesDepedencies(vite, [absolute], ssr);

  const styles: Record<string, any> = {};

  for (const dep of dependencies) {
    if (isCssFile(dep.url)) {
      let depURL = dep.url;
      if (!isCssUrlWithoutSideEffects(depURL)) {
        depURL = injectQuery(dep.url, "inline");
      }

      const mod = await vite.ssrLoadModule(depURL);

      styles[join(vite.config.root, dep.url)] = mod.default;
    }
  }

  return styles
}

export async function getManifestEntryCssTags(id: string) {
  if (import.meta.env.DEV) {
    const styles = await findStylesInModuleGraph((globalThis as any).VITE_DEV_SERVER, id, false);

    return Object.entries(
      styles
    ).map(([key, value]) => ({
      tag: "style",
      attrs: {
        type: "text/css",
        key,
        "data-vite-dev-id": key,
        "data-vite-ref": "0",
      },
      children: value,
    }))
  } else {
    const { manifest } = await import("solid-start:server-manifest");

    const entry = manifest.clientViteManifest[id];
    if (!entry) throw new Error(`No entry '${id}' found in vite manifest`);

    return (
      entry.css?.map(css => ({
        tag: "link",
        attrs: { href: `/${"_build"}/${css}`, rel: "stylesheet" }
      })) ?? []
    );
  }
}
