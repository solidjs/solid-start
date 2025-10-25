import path from "node:path";
import { join, resolve } from "pathe";
import type { DevEnvironment, EnvironmentModuleNode, ModuleNode, RunnableDevEnvironment, ViteDevServer } from "vite";

async function getViteModuleNode(
	vite: DevEnvironment,
	file: string,
	ssr = false,
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

	if (nodePath.includes("node_modules")) {
		return;
	}

	try {
		if (!node?.transformResult && !ssr) {
			await vite.transformRequest(nodePath);
			node = vite.moduleGraph.getModuleById(nodePath);
		}

		// if (ssr && !node?.ssrTransformResult) {
			// if (skip.includes(file)) {
			//   return null;
			// }
		// 	await vite.ssrLoadModule(file);
		// 	node = vite.moduleGraph.getModuleById(nodePath);
		// }

		// vite.config.logger.error = prev;
		return node;
	} catch (e) {
		// vite.config.logger.error = prev;
		return null;
	}
}

async function findModuleDependencies(
  vite: DevEnvironment,
	module: EnvironmentModuleNode,
	ssr = false,
	deps: Set<EnvironmentModuleNode>,
) {
	async function add(module: EnvironmentModuleNode) {
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
		if (module.transformResult?.deps) {
			for (const url of module.transformResult.deps) {
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
export const isCssModulesFile = (file: string) => cssModulesRegExp.test(file);

// https://github.com/remix-run/remix/blob/65326e39099f3b2285d83aecfe734ba35f668396/packages/remix-dev/vite/styles.ts#L29
const cssUrlParamsWithoutSideEffects = ["url", "inline", "raw", "inline-css"];
export const isCssUrlWithoutSideEffects = (url: string) => {
	const queryString = url.split("?")[1];

	if (!queryString) {
		return false;
	}

	const params = new URLSearchParams(queryString);
	for (const paramWithoutSideEffects of cssUrlParamsWithoutSideEffects) {
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

async function findFilesDepedencies(
	vite: DevEnvironment,
	files: Array<string>,
	ssr = false,
	deps = new Set<EnvironmentModuleNode>(),
) {
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

export async function findStylesInModuleGraph(
  vite: DevEnvironment,
	id: string,
	ssr = false,
) {
	const absolute = path.resolve(process.cwd(), id);

	const dependencies = await findFilesDepedencies(vite, [absolute], ssr);

	const styles: Record<string, any> = {};

	for (const dep of dependencies) {
		if (isCssFile(dep.url)) {
			let depURL = dep.url;
			if (!isCssUrlWithoutSideEffects(depURL)) {
				depURL = injectQuery(dep.url, "inline");
			}

      styles[join(vite.config.root, dep.url)] = dep.url;
		}
	}

	return styles;
}
