import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { SolidStartClientFileRouter, SolidStartServerFileRouter } from "../fs-router.ts";
import { analyzeModule } from "./router.ts";

const temporaryDirectories: string[] = [];

function writeRoute(source: string) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "solid-start-router-"));
  const filename = path.join(directory, "route.tsx");
  temporaryDirectories.push(directory);
  fs.writeFileSync(filename, source);
  return filename;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true });
  }
});

describe("analyzeModule", () => {
  it("returns runtime exports from TSX modules", () => {
    const route = writeRoute(`
      export type TypeOnly = string;
      const local = 1;
      export { local, local as renamed };
      export const route = {};
      export function GET() {}
      export default function Route() {
        return <main />;
      }
    `);

    const exports = analyzeModule(route);

    expect(
      exports.map(entry => entry.exportName.name ?? entry.exportName.kind.toLowerCase()),
    ).toEqual(["local", "renamed", "route", "GET", "default"]);
    expect(exports.every(entry => !entry.isType)).toBe(true);
  });

  it("preserves local-name semantics for re-exports", () => {
    const route = writeRoute(`
      export { external, external as renamedExternal } from "./external.ts";
      export { default as DefaultExport } from "./external.ts";
      export * as namespace from "./external.ts";
      export * from "./external.ts";
    `);

    const exports = analyzeModule(route);

    expect(exports.map(entry => entry.exportName.name)).toEqual([
      "external",
      "renamedExternal",
      "DefaultExport",
      "namespace",
    ]);
    expect(exports.map(entry => entry.importName.name)).toEqual([
      "external",
      "external",
      "default",
      null,
    ]);
  });

  it("throws on invalid route syntax", () => {
    const route = writeRoute("export default function Route( {");

    expect(() => analyzeModule(route)).toThrow(`Failed to parse ${route}`);
  });

  it("does not include an anonymous default export twice", () => {
    const route = writeRoute("export default () => <main />;");
    const router = new SolidStartClientFileRouter({
      dir: path.dirname(route),
      extensions: ["tsx"],
    });

    expect(router.toRoute(route)?.$component.pick).toEqual(["default", "$css"]);
  });
});

describe("toPath", () => {
  const dir = "/app/src/routes";
  const routers = [SolidStartClientFileRouter, SolidStartServerFileRouter];

  it.each([
    ["index.tsx", "/"],
    ["blog/index.tsx", "/blog/"],
    ["[id]/index.tsx", "/:id/"],
    ["about.tsx", "/about"],
    ["blog/[slug].tsx", "/blog/:slug"],
    ["docs/[[version]].tsx", "/docs/:version?"],
    ["[...404].tsx", "/*404"],
  ])("maps %s to %s", (file, expected) => {
    for (const Router of routers) {
      const router = new Router({ dir, extensions: ["tsx"] });
      expect(router.toPath(`${dir}/${file}`)).toBe(expected);
    }
  });

  // https://github.com/solidjs/solid-start/issues/2314
  it.each([
    ["reindex.tsx", "/reindex"],
    ["myindex.tsx", "/myindex"],
    ["appendix.tsx", "/appendix"],
    ["reindex/index.tsx", "/reindex/"],
    ["blog/reindex.tsx", "/blog/reindex"],
  ])("does not strip a trailing index substring from %s", (file, expected) => {
    for (const Router of routers) {
      const router = new Router({ dir, extensions: ["tsx"] });
      expect(router.toPath(`${dir}/${file}`)).toBe(expected);
    }
  });
});
