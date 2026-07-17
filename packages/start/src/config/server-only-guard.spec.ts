import { describe, expect, it } from "vitest";

import { serverOnlyGuard } from "./server-only-guard.ts";

function resolveWith(id: string, ssr: boolean) {
  const plugin = serverOnlyGuard() as any;
  const context = {
    error(message: string): never {
      throw new Error(message);
    },
  };
  return () => plugin.resolveId.call(context, id, "/src/lib/someClient.ts", { ssr });
}

describe("serverOnlyGuard", () => {
  it("fails when a client module imports @solidjs/start/http", () => {
    expect(resolveWith("@solidjs/start/http", false)).toThrowError(
      /"@solidjs\/start\/http" is server-only.*someClient\.ts/s,
    );
  });

  it("fails for the other server-only entry points in client modules", () => {
    expect(resolveWith("@solidjs/start/middleware", false)).toThrowError(/server-only/);
    expect(resolveWith("@solidjs/start/config", false)).toThrowError(/server-only/);
  });

  it("allows server modules to import server-only entry points", () => {
    expect(resolveWith("@solidjs/start/http", true)).not.toThrow();
    expect(resolveWith("@solidjs/start/middleware", true)).not.toThrow();
  });

  it("ignores unrelated ids", () => {
    expect(resolveWith("@solidjs/start/client", false)).not.toThrow();
    expect(resolveWith("solid-js", false)).not.toThrow();
    expect(resolveWith("./local-module.ts", false)).not.toThrow();
  });
});
