declare module "solid-start:client-vite-manifest" {
  export const clientViteManifest: Record<
    string,
    { css?: Array<string>; file: string; [key: string]: unknown }
  >;
}

interface StartManifest {
  getAssets(id: string): Promise<import("./server/assets/render").Asset[]>;
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
  export default Middleware as import("h3").Middleware[] | undefined;
}
