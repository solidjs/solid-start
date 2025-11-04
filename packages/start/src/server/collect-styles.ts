import path from "node:path";
import { resolve } from "pathe";
import type { DevEnvironment, EnvironmentModuleNode } from "vite";

async function getViteModuleNode(
	vite: DevEnvironment,
	file: string,
) {
	let nodePath = file;
	let node = vite.moduleGraph.getModuleById(file);

	if (!node) {
		const resolvedId = await vite.pluginContainer.resolveId(file, undefined);
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

	return node;
}

async function findModuleDependencies(
	vite: DevEnvironment,
	file: string,
	deps: Set<EnvironmentModuleNode>,
	crawledFiles = new Set<string>()
) {
	crawledFiles.add(file);
	const module = await getViteModuleNode(vite, file);
	if (!module?.id || deps.has(module)) return;

	deps.add(module);
	
	if (module.url.endsWith(".css") || module.url.includes("node_modules")) return;

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
		await findModuleDependencies(vite, dep, deps, crawledFiles);
	}
}

// Vite doesn't expose these so we just copy the list for now
// https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/constants.ts#L49C23-L50
const cssFileRegExp =
	/\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
// https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/plugins/css.ts#L160
const cssModulesRegExp = new RegExp(`\\.module${cssFileRegExp.source}`);

const isCssFile = (file: string) => cssFileRegExp.test(file);
export const isCssModulesFile = (file: string) => cssModulesRegExp.test(file);

export async function findStylesInModuleGraph(
	vite: DevEnvironment,
	id: string,
) {
	const absolute = path.resolve(process.cwd(), id);
	const dependencies = new Set<EnvironmentModuleNode>();

	try {
		await findModuleDependencies(vite, absolute, dependencies);
	} catch (e) {
		console.error(e);
	}

	const styles: Record<string, any> = {};
	for (const dep of dependencies) {
		if (dep.id && isCssFile(dep.url)) {
			styles[dep.id] = dep.url;
		}
	}

	return styles;
}
