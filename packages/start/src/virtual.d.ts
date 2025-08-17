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
    clientEntryId: string;
    clientViteManifest: Record<string, { css?: Array<string>, file?: string, [key: string]: unknown }>;
    clientAssetManifest: ClientManifest;
  }

  export const manifest: StartServerManifest;
}

declare module "solid-start:client-prod-manifest" {
  export default {} as ClientManifest;
}

declare module "#start/app" {
  export default App as import("solid-js").Component;
}
