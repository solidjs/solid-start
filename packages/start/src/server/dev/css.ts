export async function getStyleElementsForId(id: string, environment: string) {
  let assetsId = id.includes("?") ? `${id}&assets=${environment}` : `${id}?assets=${environment}`;
	if(!assetsId.startsWith("/") && !assetsId.startsWith(".")) assetsId = `/${assetsId}`;

  const assets: { css: { href: string, "data-vite-dev-id": string }[] } = await import(/* @vite-ignore */ assetsId).then(mod => mod.default)

  return await Promise.all(assets.css.map(async (v) => ({
		tag: "style" as const,
		attrs: {
			type: "text/css",
			key: v.href,
			"data-vite-dev-id": v["data-vite-dev-id"],
			"data-vite-ref": "0",
		},
		children: await import(/* @vite-ignore */ `${v.href}?inline`).then(mod => mod.default),
  })));
}
