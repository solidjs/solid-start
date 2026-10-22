import { tmpdir } from "node:os";
import { join } from "node:path";
import { normalizePath } from "vite";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type ServerFunctionsFilter, serverFunctionsPlugin } from "./index.ts";

// Vite (8.2 and later) resolves its root and every module id to the real path.
// On Windows the working directory keeps the path it was entered through, so it
// can name the same project through a junction or symlink.
const root = normalizePath(join(tmpdir(), "solid-start-app"));
const linkedRoot = normalizePath(join(tmpdir(), "solid-start-link"));

const code = `
export async function getMessage() {
  "use server";
  return "hello";
}
`;

function clientTransform(filter?: ServerFunctionsFilter) {
  const plugins = serverFunctionsPlugin({
    manifest: "virtual:server-fn-manifest",
    runtime: { server: "virtual:server-runtime", client: "virtual:client-runtime" },
    filter,
  }) as any[];
  for (const plugin of plugins) plugin.configResolved?.({ root, mode: "production" });

  const compiler = plugins.find(p => p.name === "solid-start:server-functions/compiler");
  const context = { environment: { config: { consumer: "client" } }, warn() {} };
  return (id: string) => compiler.transform.call(context, code, id);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("serverFunctionsPlugin", () => {
  it("compiles server functions when the working directory is a link to the root", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(linkedRoot);
    const transform = clientTransform();

    const result = await transform(`${root}/src/message.ts`);

    expect(result).not.toBeNull();
    expect(result.code).toContain("virtual:client-runtime");
    expect(result.code).not.toContain("hello");
  });

  it("leaves modules outside the root's src folder alone", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(linkedRoot);
    const transform = clientTransform();

    expect(await transform(`${root}/scripts/message.ts`)).toBeNull();
  });

  it("resolves relative filter patterns against the root", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(linkedRoot);
    const transform = clientTransform({ include: "app/**/*.ts" });

    expect(await transform(`${root}/app/message.ts`)).not.toBeNull();
    expect(await transform(`${root}/src/message.ts`)).toBeNull();
  });
});
