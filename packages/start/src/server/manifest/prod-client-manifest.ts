export function getClientProdManifest() {
  return {
    import(id) {
      // @ts-ignore
      return import(/* @vite-ignore */ window.manifest[id].output);
    },
    async getAssets(id) {
      if (id.startsWith("./")) id = id.slice(2);

      // @ts-ignore
      return window.manifest[id]?.assets ?? [];
    },
    async json() {
      // @ts-ignore
      return window.manifest;
    },
  } satisfies StartManifest & {
    json(): Promise<Record<string, any>>;
    import(id: string): Promise<any>;
  };
}
