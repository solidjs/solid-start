export const DEFAULT_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

export const CLIENT_BASE_PATH = "_build";

export const VIRTUAL_MODULES = {
	clientViteManifest: "solid-start:client-vite-manifest",
	getClientManifest: "solid-start:get-client-manifest",
	getManifest: "solid-start:get-manifest",
	middleware: "solid-start:middleware",
	serverFnManifest: "solidstart:server-fn-manifest",
} as const;

export const VITE_ENVIRONMENT_NAMES = {
	client: "client",
	server: "ssr",
};

export type ViteEnvironmentNames =
	(typeof VITE_ENVIRONMENT_NAMES)[keyof typeof VITE_ENVIRONMENT_NAMES];

export const ENTRY_POINTS = {
	client: "virtual:solid-start-client-entry",
	server: "virtual:solid-start-server-entry",
} as const;
