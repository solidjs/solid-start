import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { boundaryModules } from "./boundary-modules.ts";

function resolveWith(id: string, ssr: boolean) {
  const plugin = boundaryModules() as any;
  const context = {
    error(message: string): never {
      throw new Error(message);
    },
  };
  return () => plugin.resolveId.call(context, id, "/src/lib/someClient.ts", { ssr });
}

describe("boundaryModules", () => {
  it("fails when a client module imports server-only", () => {
    expect(resolveWith("server-only", false)).toThrowError(/server-only.*someClient\.ts/s);
  });

  it("fails when a server module imports client-only", () => {
    expect(resolveWith("client-only", true)).toThrowError(/client-only.*someClient\.ts/s);
  });

  it("resolves the markers to an empty module in the allowed environment", () => {
    const plugin = boundaryModules() as any;
    const serverOnlyId = resolveWith("server-only", true)();
    const clientOnlyId = resolveWith("client-only", false)();
    expect(plugin.load(serverOnlyId)).toBe("export {}");
    expect(plugin.load(clientOnlyId)).toBe("export {}");
  });

  it("ignores unrelated ids", () => {
    expect(resolveWith("solid-js", false)()).toBe(null);
    expect(resolveWith("./local-module.ts", false)()).toBe(null);
  });

  // Regression guard for #2068: Start's server-only entry points must carry
  // the marker so client-reachable imports of them fail loudly instead of
  // shipping server code to the browser and crashing hydration.
  it("marks Start's server-only entry points with server-only", () => {
    for (const entry of ["http/index.ts", "middleware/index.ts"]) {
      const source = readFileSync(join(import.meta.dirname, "..", entry), "utf-8");
      expect(source, `src/${entry} must import "server-only"`).toMatch(
        /^import "server-only";$/m,
      );
    }
  });
});
