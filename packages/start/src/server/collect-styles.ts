import path from "node:path";
import type { DevEnvironment, EnvironmentModuleNode } from "vite";

async function getViteModuleNode(vite: DevEnvironment, file: string, importer?: string) {
  try {
    const res = await vite.fetchModule(file, importer);
    if (!("id" in res)) return;
    return vite.moduleGraph.getModuleById(res.id);
  } catch (err) {}
}

type StyleFilter = (id: string) => boolean;

async function findModuleDependencies(
  vite: DevEnvironment,
  file: string,
  deps: Set<EnvironmentModuleNode>,
  filter: StyleFilter,
  crawledFiles = new Set<string>(),
  importer?: string,
) {
  crawledFiles.add(file);
  const module = await getViteModuleNode(vite, file, importer);
  if (!module?.id || deps.has(module)) return;

  deps.add(module);

  if (module.url.endsWith(".css")) return;

  // Apply user-config file filters only to real files (virtual modules should always be included)
  if (module.file && !module.id.startsWith("\0") && !filter(module.file)) return;

  if (!module.transformResult) {
    await vite.transformRequest(module.id).catch(() => {});
  }
  if (!module.transformResult?.deps) return;

  // Relying on module.transformResult.deps instead of module.importedModules because:
  // transformResult properly separates imports into deps and dynamicDeps, importedModules doesn't
  // Style crawling has to skip dynamic imports as such modules load their styles themselves
  for (const dep of module.transformResult.deps) {
    if (crawledFiles.has(dep)) {
      continue;
    }
    await findModuleDependencies(vite, dep, deps, filter, crawledFiles, module.id);
  }
}

// Vite doesn't expose these so we just copy the list for now
// https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/constants.ts#L49C23-L50
const cssFileRegExp = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)$/;
// https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/plugins/css.ts#L160
const cssModulesRegExp = new RegExp(`\\.module${cssFileRegExp.source}`);

const isCssFile = (file: string) => cssFileRegExp.test(file);
export const isCssModulesFile = (file: string) => cssModulesRegExp.test(file);

export async function findStylesInModuleGraph(
  vite: DevEnvironment,
  id: string,
  filter: StyleFilter,
) {
  const absolute = path.resolve(process.cwd(), id);
  const dependencies = new Set<EnvironmentModuleNode>();

  try {
    await findModuleDependencies(vite, absolute, dependencies, filter);
  } catch (e) {
    console.error(e);
  }

  const styles: Record<string, any> = {};
  for (const dep of dependencies) {
    if (dep.id && isCssFile(dep.url)) {
      // Virtual modules (e.g. UnoCSS /__uno.css) have dep.file === null and
      // dep.id starting with \0. Using dep.url (e.g. "/__uno.css") in the
      // generated import() fails in Vite 8 module runner with ERR_DENIED_ID
      // because the URL looks like a nonexistent filesystem path.
      //
      // Instead, use dep.id (the resolved virtual module ID, e.g. \0virtual:uno.css)
      // which wrapId() converts to /@id/__x00__virtual:uno.css — a safe form
      // that Vite's /@id/ resolution plugin can resolve through the plugin pipeline.
      // Real CSS files (dep.file is set) keep using dep.url as before.
      styles[dep.id] = dep.file === null ? dep.id : dep.url;
    }
  }

  return styles;
}