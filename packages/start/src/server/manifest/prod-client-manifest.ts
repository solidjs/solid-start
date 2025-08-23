export function getClientProdManifest() {
  return {
    import(id) {
      // @ts-ignore
      return import(/* @vite-ignore */ window.manifest[id].output)
    },
    async getAssets(id) {
      // @ts-ignore
      return window.manifest[id]?.assets ?? []
    },
    async json() {
      // @ts-ignore
      return window.manifest
    },
  } satisfies StartManifest & { json(): Promise<Record<string, any>> }
}
