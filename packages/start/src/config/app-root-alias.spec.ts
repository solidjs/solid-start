import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer, type Plugin, type ViteDevServer } from "vite";

import { appRootAlias } from "./app-root-alias.ts";

const temporaryDirectories: string[] = [];
const servers: ViteDevServer[] = [];

function createProject() {
  const root = mkdtempSync(join(tmpdir(), "solid-start-app-root-alias-"));
  temporaryDirectories.push(root);

  for (const directory of ["src", "shared", "lib/src"]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  writeFileSync(join(root, "package.json"), "{}");
  writeFileSync(join(root, "lib/package.json"), "{}");
  writeFileSync(join(root, "src/demo.ts"), 'export default "app";');
  writeFileSync(join(root, "lib/src/demo.ts"), 'export default "package";');

  return {
    root,
    appImporter: join(root, "src/app.tsx"),
    sharedAppImporter: join(root, "shared/example.ts"),
    packageImporter: join(root, "lib/src/index.ts"),
  };
}

function resolverFor(root: string) {
  const plugin = appRootAlias(root, "./src") as any;
  const resolve = vi.fn(async (id: string) => ({ id }));

  return {
    resolve,
    resolveId(id: string, importer?: string) {
      return plugin.resolveId.call({ resolve }, id, importer, {});
    },
  };
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => server.close()));
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true });
  }
});

describe("appRootAlias", () => {
  it("resolves ~ from files owned by the app package", async () => {
    const { root, appImporter, sharedAppImporter } = createProject();
    const resolver = resolverFor(root);

    await expect(resolver.resolveId("~/demo", appImporter)).resolves.toEqual({
      id: join(root, "src/demo"),
    });
    await expect(resolver.resolveId("~/demo", `${sharedAppImporter}?raw`)).resolves.toEqual({
      id: join(root, "src/demo"),
    });
  });

  it("leaves ~ imports from a workspace package to importer-aware resolvers", async () => {
    const { root, packageImporter } = createProject();
    const resolver = resolverFor(root);

    await expect(resolver.resolveId("~/demo", packageImporter)).resolves.toBe(null);
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it("allows an importer-aware Vite plugin to resolve a package-local ~ path", async () => {
    const { root, appImporter, packageImporter } = createProject();
    const packageRoot = join(root, "lib");
    const packagePaths: Plugin = {
      name: "test:package-paths",
      enforce: "pre",
      async resolveId(id, importer, options) {
        if (id !== "~/demo" || !importer?.startsWith(packageRoot)) return null;
        return this.resolve(join(packageRoot, "src/demo"), importer, {
          ...options,
          skipSelf: true,
        });
      },
    };
    const server = await createServer({
      configFile: false,
      logLevel: "silent",
      root,
      server: { middlewareMode: true },
      plugins: [appRootAlias(root, "./src"), packagePaths],
    });
    servers.push(server);

    await expect(server.pluginContainer.resolveId("~/demo", appImporter)).resolves.toMatchObject({
      id: realpathSync.native(join(root, "src/demo.ts")),
    });
    await expect(
      server.pluginContainer.resolveId("~/demo", packageImporter),
    ).resolves.toMatchObject({
      id: realpathSync.native(join(root, "lib/src/demo.ts")),
    });
  });

  it("resolves entry aliases without an importer and ignores similar bare ids", async () => {
    const { root } = createProject();
    const resolver = resolverFor(root);

    await expect(resolver.resolveId("~")).resolves.toEqual({
      id: join(root, "src"),
    });
    await expect(resolver.resolveId("~package/example")).resolves.toBe(null);
  });
});
