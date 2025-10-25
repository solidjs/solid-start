declare module "solid-start:client-vite-manifest" {
	export const clientViteManifest: Record<
		string,
		{ css?: Array<string>; file: string; [key: string]: unknown }
	>;
}

interface StartManifest {
	getAssets(id: string): Promise<import("./server/renderAsset").Asset[]>;
}

declare module "solid-start:get-client-manifest" {
	export const getClientManifest: () => StartManifest;
}

declare module "solid-start:get-manifest" {
	export const getManifest: (target: "client" | "ssr") => StartManifest;
}

declare module "solid-start:app" {
	export default App as import("solid-js").Component;
}

declare module "solid-start:middleware" {
	type MaybeArray<T> = T | Array<T>;
	export default Middleware as import("h3").Middleware[];
}

type ImportAssetsResultRaw = {
  entry?: string;
  js: { href: string }[];
  css: CssLinkAttributes[];
};

type CssLinkAttributes = {
  href: string;
  "data-vite-dev-id"?: string;
};

type ImportAssetsOptions = {
  import?: string;
  environment?: string; // TODO: can we remove in favor of asEntry and universal?
  asEntry?: boolean;
  // universal?: boolean;
};

// TODO: rename to just Assets?
type ImportAssetsResult = ImportAssetsResultRaw & {
  merge(...args: ImportAssetsResultRaw[]): ImportAssetsResult;
};


declare module "*?assets" {
  const assets: ImportAssetsResultRaw;
  export default assets;
}

declare module "*?assets=client" {
  const assets: ImportAssetsResultRaw;
  export default assets;
}

declare module "*?assets=ssr" {
  const assets: ImportAssetsResultRaw;
  export default assets;
}
