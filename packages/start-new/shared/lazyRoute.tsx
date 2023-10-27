/// <reference types="vinxi/types/client" />
import { createComponent, lazy, onCleanup } from "solid-js";
import { appendStyles, cleanupStyles, updateStyles } from "vinxi/css";

import { renderAsset } from "../server/renderAsset";

export default function lazyRoute(
	component,
	clientManifest,
	serverManifest,
	exported = "default",
) {
	return lazy(async () => {
		if (import.meta.env.DEV) {
			let manifest = import.meta.env.SSR ? serverManifest : clientManifest;

			const mod = await import(
				/* @vite-ignore */ manifest.inputs[component.src].output.path
			);
			if (!mod[exported]) console.error(`Module ${component.src} does not export ${exported}`)
			const Component = mod[exported];
			let assets = await clientManifest.inputs?.[component.src].assets();
			const styles = assets.filter((asset) => asset.tag === "style");

			if (typeof window !== "undefined" && import.meta.hot) {
				import.meta.hot.on("css-update", (data) => {
					updateStyles(styles, data);
				});
			}

			const Comp = (props) => {
				if (typeof window !== "undefined") {
					appendStyles(styles);
				}

				onCleanup(() => {
					if (typeof window !== "undefined") {
						// remove style tags added by vite when a CSS file is imported
						cleanupStyles(styles);
					}
				});
				return [
					...assets.map((asset) => renderAsset(asset)),
					createComponent(Component, props),
				];
			};
			return { default: Comp };
		} else {
			const mod = await component.import();
			const Component = mod[exported];
			let assets = await clientManifest.inputs?.[component.src].assets();
			const Comp = (props) => {
				return [
					...assets.map((asset) => renderAsset(asset)),
					createComponent(Component, props),
				];
			};
			return { default: Comp };
		}
	});
}
