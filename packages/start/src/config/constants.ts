export const DEFAULT_EXTENSIONS = ["js", "jsx", "ts", "tsx"];

export const CLIENT_BASE_PATH = "_build";

export const VIRTUAL_MODULES = {
  middleware: "solid-start:middleware",
  serovalPlugins: "solid-start:seroval-plugins",
  serverFnManifest: "solid-start:server-fn-manifest",
  serverFnErrorHandler: "solid-start:server-fn-error-handler",
  clientEntry: "solid-start:client-entry",
  serverEntry: "solid-start:server-entry",
  app: "solid-start:app",
} as const;

export const VITE_ENVIRONMENTS = {
  client: "client" as const,
  server: "ssr" as const,
};
