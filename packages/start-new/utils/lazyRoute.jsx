/// <reference types="vinxi/client" />
import { createComponent, lazy, onCleanup } from "solid-js";
import { appendStyles, cleanupStyles, updateStyles } from "vinxi/lib/style";

import { renderAsset } from "./assets";

export default function lazyRoute(component, clientManifest, serverManifest) {
	return lazy(async () => {
		if (import.meta.env.DEV) {
			let manifest = import.meta.env.SSR ? serverManifest : clientManifest;
			const { default: Component } = await import(
				/* @vite-ignore */ manifest.inputs[component.src].output.path
			);
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
					// remove style tags added by vite when a CSS file is imported
					cleanupStyles(styles);
				});
				return [
					...assets.map((asset) => renderAsset(asset)),
					createComponent(Component, props),
				];
			};
			return { default: Comp };
		} else {
			const { default: Component } = await component.import();
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
