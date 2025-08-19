export function getClientProdManifest() {
  return {
    import(id) {
      return import(/* @vite-ignore */ window.manifest[id].output)
    },
    async getAssets(id) {
      return window.manifest[id]?.assets ?? []
    },
    async json() {
      return window.manifest
    },
  } satisfies StartManifest & { json(): Promise<Record<string, any>> }
}
