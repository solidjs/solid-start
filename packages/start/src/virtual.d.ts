type LinkAssetAttrs = { href: string, key: string } & (
  { rel: "stylesheet", fetchPriority?: string }
  | { rel: "modulepreload" });

type ManifestAsset = {
  tag: "link",
  attrs: LinkAssetAttrs
}

type ClientManifest = Record<string, {
  output: string,
  assets?: Array<ManifestAsset>
}>;

declare module "solid-start:server-manifest" {
  interface StartServerManifest {
    clientViteManifest: Record<string, { css?: Array<string>, file: string, [key: string]: unknown }>;
  }

  export const manifest: StartServerManifest;
}


interface StartManifest {
  import(id: string): Promise<any>;
  getAssets(id: string): Promise<any[]>;
}

declare module "solid-start:get-ssr-manifest" {
  export const getSsrManifest: (target: "client" | "server") => StartManifest;
}

declare module "solid-start:get-client-manifest" {
  export const getClientManifest: () => StartManifest;
}

declare module "solid-start:get-manifest" {
  export const getManifest: (ssr: boolean) => StartManifest;
}

declare module "#start/app" {
  export default App as import("solid-js").Component;
}

declare module "solid-start:middleware" {
  type MaybeArray<T> = T | Array<T>;
  export default Middleware as {
    onRequest?: MaybeArray<import("h3")._RequestMiddleware>;
    onBeforeResponse?: MaybeArray<import("h3")._ResponseMiddleware>;
  };
}
