import { join } from "pathe";

export function getClientDevManifest() {
  return {
    import(id) {
      return import(/* @vite-ignore */ join("/", id))
    },
    async getAssets(id) {
      const assetsPath =
        join(
          import.meta.env.BASE_URL,
          `@manifest/client/${Date.now()}/assets?id=${id}`,
        );

      const assets = (await import(/* @vite-ignore */ assetsPath)).default;

      return await Promise.all(assets.map(async v => ({
        ...v,
        children: await v.children()
      })));
    },
  } satisfies StartManifest & { import(id: string): Promise<any> };
}
