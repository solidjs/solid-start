export function getClientProdManifest() {
  return {
    import(id) {
      // @ts-ignore
      return import(/* @vite-ignore */ window.manifest[id].output)
    },
    async getAssets(id) {
      if (id.startsWith("./")) id = id.slice(2);

      // @ts-ignore
      return window.manifest[id]?.assets ?? []
    },
  } satisfies StartManifest & { import(id: string): Promise<any>; }
}
