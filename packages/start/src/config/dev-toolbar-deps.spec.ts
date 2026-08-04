import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Plugin } from "vite";
import { afterEach, expect, it } from "vitest";

import { solidStart, type SolidStartOptions } from "./index.ts";

const cwd = process.cwd();
const roots: string[] = [];

afterEach(() => {
  process.chdir(cwd);
  for (const root of roots.splice(0)) rmSync(root, { recursive: true });
});

async function resolveDevConfig(options?: SolidStartOptions) {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "solid-start-dev-toolbar-deps-")));
  roots.push(root);
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "package.json"), "{}");
  writeFileSync(join(root, "src/app.tsx"), "export default function App() {}");
  process.chdir(root);

  const plugin = solidStart(options).find(
    (candidate): candidate is Plugin =>
      typeof candidate === "object" &&
      candidate !== null &&
      "name" in candidate &&
      candidate.name === "solid-start:config",
  );
  const config = plugin?.config;
  const handler = typeof config === "function" ? config : config?.handler;
  return (await handler?.call({} as never, {}, { command: "serve", mode: "development" })) as
    | { environments?: { client?: { optimizeDeps?: { include?: string[] } } } }
    | undefined;
}

it("pre-bundles the dev toolbar's CommonJS dependencies", async () => {
  const config = await resolveDevConfig();

  expect(config?.environments?.client?.optimizeDeps?.include).toEqual([
    "@solidjs/start > source-map-js",
    "@solidjs/start > error-stack-parser",
  ]);
});

it("leaves them alone when the dev toolbar is disabled", async () => {
  const config = await resolveDevConfig({ devOverlay: false });

  expect(config?.environments?.client?.optimizeDeps).toBeUndefined();
});
