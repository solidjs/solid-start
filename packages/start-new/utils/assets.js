/// <reference types="vinxi/client" />
import { Link, Style } from "@solidjs/meta";
import { lazy } from "solid-js";
import { updateStyles } from "vinxi/lib/style";

const assetMap = {
	style: (props) => <Style {...props.attrs}>{props.children}</Style>,
	link: (props) => <Link {...props.attrs} />,
	script: (props) => {
		return props.src ? <script {...props}></script> : null;
	},
};

export function renderAsset(asset) {
	let { tag, attrs: { key, ...attrs } = { key: undefined }, children } = asset;
	return assetMap[tag]({ attrs, key, children });
}

export const createAssets = (src, manifest) =>
	lazy(async () => {
		const assets = await manifest.inputs[src].assets();

		const styles = assets.filter((asset) => asset.tag === "style");

		if (typeof window !== "undefined" && import.meta.hot) {
			import.meta.hot.on("css-update", (data) => {
				updateStyles(styles, data);
			});
		}

		return {
			default: function Assets() {
				return <>{assets.map((asset) => renderAsset(asset))}</>;
			},
		};
	});