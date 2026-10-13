import type { Plugin } from "vite";
import { describe, expect, it } from "vitest";
import { solidPlugins } from "./solid.ts";

const SOURCE = `export default function Page() {
  return (
    <main $ServerOnly>
      <p>server only content</p>
    </main>
  );
}`;

/** Compiles SOURCE for the client, as `vite serve` or `vite build` would. */
async function compileForClient(
  command: "serve" | "build",
  options: Parameters<typeof solidPlugins>[0] = {},
): Promise<string> {
  const plugins = solidPlugins({ ssr: true, ...options }) as Plugin[];
  const config = { command, mode: command === "serve" ? "development" : "production" };
  for (const plugin of plugins) {
    await (plugin.configResolved as any)?.call({}, config);
  }
  const solid = plugins.find(plugin => plugin.name === "solid")!;
  const result = await (solid.transform as any).call(
    {},
    SOURCE,
    `${process.cwd()}/src/routes/page.tsx`,
    { ssr: false },
  );
  return result.code;
}

describe("solidPlugins", () => {
  // Hot reloading re-runs the component on the client, which needs the
  // template (https://github.com/solidjs/solid-start/issues/1930).
  it("keeps $ServerOnly templates in the client dev build", async () => {
    expect(await compileForClient("serve")).toContain("server only content");
  });

  it("leaves $ServerOnly templates out of the client production build", async () => {
    expect(await compileForClient("build")).not.toContain("server only content");
  });

  it("keeps the value the user sets", async () => {
    const code = await compileForClient("serve", {
      solid: { omitServerOnlyTemplates: true } as any,
    });
    expect(code).not.toContain("server only content");
  });

  it("leaves the templates out when hot reloading is turned off", async () => {
    expect(await compileForClient("serve", { hot: false })).not.toContain("server only content");
  });
});
