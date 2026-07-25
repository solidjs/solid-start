import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, createServer, type Plugin, type ViteDevServer } from "vite";
import { afterEach, expect, it } from "vitest";

import { appRootAlias } from "./app-root-alias.ts";

const roots: string[] = [];
const servers: ViteDevServer[] = [];

/** An app package with a `src` app root, plus a nested `lib` workspace package. */
function createProject() {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "solid-start-app-root-alias-")));
  roots.push(root);

  mkdirSync(join(root, "src"));
  mkdirSync(join(root, "lib/src"), { recursive: true });
  writeFileSync(join(root, "package.json"), "{}");
  writeFileSync(join(root, "lib/package.json"), "{}");
  writeFileSync(join(root, "src/demo.ts"), 'export default "app";');
  writeFileSync(join(root, "lib/src/demo.ts"), 'export default "package";');

  return root;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => server.close()));
  for (const root of roots.splice(0)) rmSync(root, { recursive: true });
});

it("resolves ~ for the app package, leaving other packages to importer-aware plugins", async () => {
  const root = createProject();
  const packageRoot = join(root, "lib");
  // Stands in for vite-tsconfig-paths: maps `~` to the importing package's root.
  const packagePaths: Plugin = {
    name: "test:package-paths",
    enforce: "pre",
    resolveId(id, importer, options) {
      if (id !== "~/demo" || !importer?.startsWith(packageRoot)) return null;
      return this.resolve(join(packageRoot, "src/demo"), importer, { ...options, skipSelf: true });
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

  await expect(
    server.pluginContainer.resolveId("~/demo", join(root, "src/app.tsx")),
  ).resolves.toMatchObject({ id: join(root, "src/demo.ts") });
  await expect(
    server.pluginContainer.resolveId("~/demo", join(root, "lib/src/index.ts")),
  ).resolves.toMatchObject({ id: join(root, "lib/src/demo.ts") });
});

it("resolves ~ in stylesheets, which are resolved without user plugins", async () => {
  const root = createProject();
  writeFileSync(join(root, "src/theme.css"), "body { color: red; }");
  writeFileSync(join(root, "src/app.css"), '@import "~/theme.css";');
  writeFileSync(join(root, "src/main.js"), 'import "./app.css";');

  const result = (await build({
    configFile: false,
    logLevel: "silent",
    root,
    plugins: [appRootAlias(root, "./src")],
    build: { write: false, rollupOptions: { input: join(root, "src/main.js") } },
  })) as { output: { fileName: string; source?: unknown }[] };

  const css = result.output.find(chunk => chunk.fileName.endsWith(".css"));
  expect(String(css?.source)).toContain("color:red");
});
