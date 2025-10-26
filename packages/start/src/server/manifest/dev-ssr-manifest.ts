import { join, normalize } from "pathe";

export function getSsrDevManifest(environment: "client" | "ssr") {
  return {
    path: (id: string) => normalize(join("/", id)),
    async getAssets(id) {
      const assetsPath =
        join(
          import.meta.env.BASE_URL,
          `@manifest/${environment}/${Date.now()}/assets?id=${id}`,
        );

      return (await import(/* @vite-ignore */ assetsPath)).default;
    },
  } satisfies StartManifest & {
		path(id: string): string;
	};
}

export { getSsrDevManifest as getSsrManifest };
