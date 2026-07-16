import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

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

    expect(analyzeModule(route)).toEqual([
      { n: "local", ln: "local" },
      { n: "renamed", ln: "local" },
      { n: "route", ln: "route" },
      { n: "GET", ln: "GET" },
      { n: "default", ln: "Route" },
    ]);
  });

  it("preserves local-name semantics for re-exports", () => {
    const route = writeRoute(`
      export { external, external as renamedExternal } from "./external";
      export { default as DefaultExport } from "./external";
      export * as namespace from "./external";
      export * from "./external";
    `);

    expect(analyzeModule(route)).toEqual([
      { n: "external", ln: "external" },
      { n: "renamedExternal", ln: "external" },
      { n: "DefaultExport", ln: "DefaultExport" },
      { n: "namespace", ln: "namespace" },
    ]);
  });

  it("throws on invalid route syntax", () => {
    const route = writeRoute("export default function Route( {");

    expect(() => analyzeModule(route)).toThrow(`Failed to parse ${route}`);
  });
});
