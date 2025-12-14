export const DEFAULT_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

export const CLIENT_BASE_PATH = "_build";

export const VIRTUAL_MODULES = {
  clientViteManifest: "solid-start:client-vite-manifest",
  getClientManifest: "solid-start:get-client-manifest",
  getManifest: "solid-start:get-manifest",
  middleware: "solid-start:middleware",
  serverFnManifest: "solidstart:server-fn-manifest",
  clientEntry: "solid-start:client-entry",
  serverEntry: "solid-start:server-entry",
  app: "solid-start:app",
} as const;

export const VITE_ENVIRONMENTS = {
  client: "client",
  server: "ssr",
};
