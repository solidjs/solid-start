import { relative, resolve } from "node:path";
import { normalizePath, type PluginOption } from "vite";

import { VITE_ENVIRONMENTS } from "../constants.ts";
import { fileSystemWatcher } from "./fs-watcher.ts";
import type { BaseFileSystemRouter } from "./router.ts";
import { treeShake } from "./tree-shake.ts";

export const moduleId = "solid-start:routes";

export interface FsRoutesArgs {
	routers: Record<"client" | "ssr", BaseFileSystemRouter>;
}

export function fsRoutes({ routers }: FsRoutesArgs): Array<PluginOption> {
	(globalThis as any).ROUTERS = routers;

	return [
		{
			name: "solid-start-fs-routes",
			enforce: "pre",
			resolveId(id) {
				if (id === moduleId) return id;
			},
			async load(id) {
				const root = this.environment.config.root;
				const isBuild = this.environment.mode === "build";

				if (id !== moduleId) return;
				const js = jsCode();

				const router = (globalThis as any).ROUTERS[this.environment.name];

				const routes = await router.getRoutes();

        let assetImports: Promise<string>[] = [];

				let routesCode = JSON.stringify(routes ?? [], (k, v) => {
					if (v === undefined) return undefined;

					if (k.startsWith("$$")) {
						const buildId = `${v.src}?${v.pick.map((p: any) => `pick=${p}`).join("&")}`;

						/**
						 * @type {{ [key: string]: string }}
						 */
						const refs: Record<string, string> = {};
						for (var pick of v.pick) {
							refs[pick] = js.addNamedImport(pick, buildId);
						}
						return {
							require: `_$() => ({ ${Object.entries(refs)
								.map(([pick, namedImport]) => `'${pick}': ${namedImport}`)
								.join(", ")} })$_`,
							// src: isBuild ? relative(root, buildId) : buildId
						};
					} else if (k.startsWith("$")) {
						const buildId = `${v.src}?${v.pick.map((p: any) => `pick=${p}`).join("&")}`;

            const [id, queryString] = relative(root, buildId).split("?");
            const query = new URLSearchParams(queryString ?? "");
            const resolved = this.resolve(`${id}?assets&${query.toString()}`)
            const assetIndex = assetImports.length;
            assetImports.push(resolved.then(resolved => `import assets_${assetIndex} from "${resolved!.id}";`))

						return {
							assets: `_$(() => assets_${assetIndex})$_`,
							import:
								this.environment.name === VITE_ENVIRONMENTS.server
									? `_$() => import(/* @vite-ignore */ '${buildId}')$_`
                  : `_$() => import(assets_${assetIndex}.entry)$_`,
						};
					}
					return v;
				});

        routesCode = routesCode.replaceAll("\\n", "");
				routesCode = routesCode.replaceAll('"_$(', "(").replaceAll(')$_"', ")");

				const code = `
${js.getImportStatements()}
${(await Promise.all(assetImports)).join("\n")}
${
	this.environment.name === VITE_ENVIRONMENTS.server
		? ""
		: `
import { getClientManifest } from "solid-start:get-client-manifest";
function clientManifestImport(id) {
  return getClientManifest().import(id)
}`
}
export default ${routesCode}`;
				return code;
			},
		},
		treeShake(),
		fileSystemWatcher(routers),
	];
}

function jsCode() {
	const imports = new Map();
	let vars = 0;

	function addImport(p: any) {
		let id = imports.get(p);
		if (!id) {
			id = {};
			imports.set(p, id);
		}

		const d = "routeData" + vars++;
		id["default"] = d;
		return d;
	}

	function addNamedImport(name: string | number, p: any) {
		let id = imports.get(p);
		if (!id) {
			id = {};
			imports.set(p, id);
		}

		const d = "routeData" + vars++;
		id[name] = d;
		return d;
	}

	const getNamedExport = (p: any) => {
		const id = imports.get(p);

		delete id["default"];

		return Object.keys(id).length > 0
			? `{ ${Object.keys(id)
					.map((k) => `${k} as ${id[k]}`)
					.join(", ")} }`
			: "";
	};

	const getImportStatements = () => {
		return `${[...imports.keys()]
			.map(
				(i) =>
					`import ${
						imports.get(i).default
							? `${imports.get(i).default}${Object.keys(imports.get(i)).length > 1 ? ", " : ""}`
							: ""
					} ${getNamedExport(i)} from '${i}';`,
			)
			.join("\n")}`;
	};

	return {
		addImport,
		addNamedImport,
		getImportStatements,
	};
}
