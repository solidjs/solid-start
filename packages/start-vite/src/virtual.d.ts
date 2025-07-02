declare module "solid-start:server-manifest" {
  interface StartServerManifest {
    clientEntryId: string;
    clientViteManifest: Record<string, any>;
    routes: Record<string, { output: string }>;
  }

  export const manifest: StartServerManifest;
}

declare module "solid-start:client-prod-manifest" {
  type Manifest = Record<string, { output: string }>;

  export default {} as Manifest;
}
