declare module "virtual:solid-manifest" {
  // Dev: an async asset resolver `{ resolve, resolveSync }`; prod: the Vite
  // client manifest (plus `_base`). Provided by vite-plugin-solid and passed
  // through to renderToStream/renderToString as the `manifest` option.
  const manifest: Record<string, any>;
  export default manifest;
}

declare module "virtual:solid-manifest/client" {
  // Dynamic-entry source keys -> resolved client asset URLs. Empty in dev
  // (Vite's client owns the dev CSS lifecycle).
  const assets: Record<string, { js: string[]; css: string[] }>;
  export default assets;
}

declare module "solid-start:app" {
  export default App as import("solid-js").Component;
}

declare module "solid-start:middleware" {
  type MaybeArray<T> = T | Array<T>;
  export default Middleware as import("h3").Middleware[];
}
