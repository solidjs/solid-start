const assetMap = {
	style: (props) => <style {...props.attrs}>{props.children}</style>,
	link: (props) => <link {...props.attrs} />,
	script: (props) => {
		return props.attrs.src ? (
			<script {...props.attrs} id={props.key}>
				{" "}
			</script>
		) : null;
	},
};

export function renderAsset(asset) {
	let { tag, attrs: { key, ...attrs } = { key: undefined }, children } = asset;
	return assetMap[tag]({ attrs, key, children });
}