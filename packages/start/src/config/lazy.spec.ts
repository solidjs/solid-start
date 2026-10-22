import { afterEach, describe, expect, it, vi } from "vitest";

import lazy from "./lazy.ts";

async function transform(
  code: string,
  id = `${process.cwd()}/src/routes/page.tsx`,
  root = process.cwd(),
) {
  const plugin = lazy() as any;
  const context = { environment: { name: "ssr", config: { root } } };
  return plugin.transform.call(context, code, id);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("lazy", () => {
  it("appends the module id without moving existing code", async () => {
    const code = `import { A } from "./a.ts";\nexport default function Page() { return A; }`;
    const result = await transform(code);

    expect(result.code.startsWith(code)).toBe(true);
    expect(result.code).toContain(`export const id$$ = "src/routes/page.tsx";`);
    expect(result.map).toBeNull();
  });

  it("imports lazy from the server runtime", async () => {
    const result = await transform(
      `import { lazy } from "solid-js";\nconst Page = lazy(() => import("./page.tsx"));\nexport default Page;`,
    );

    expect(result.code).toContain(`import { lazy } from "@solidjs/start/server";`);
    expect(result.code).not.toMatch(/import \{ lazy \} from "solid-js"/);
    expect(result.code).toContain(`export const id$$ = "src/routes/page.tsx";`);
    expect(result.map).toBeTruthy();
  });

  it("names the module relative to the root when the working directory is a link to it", async () => {
    // Vite (8.2 and later) resolves its root and module ids to the real path.
    // On Windows the working directory keeps the junction or symlink path.
    vi.spyOn(process, "cwd").mockReturnValue("/link/app");
    const result = await transform(
      `import { A } from "./a.ts";\nexport default A;`,
      "/real/app/src/routes/page.tsx",
      "/real/app",
    );

    expect(result.code).toContain(`export const id$$ = "src/routes/page.tsx";`);
  });

  it("skips a module without a default export or lazy", async () => {
    expect(await transform(`import { A } from "./a.ts";\nexport const B = A;`)).toBeUndefined();
  });

  it("skips the client environment", async () => {
    const plugin = lazy() as any;
    const context = { environment: { name: "client" } };
    expect(
      await plugin.transform.call(context, `import A from "./a.ts";\nexport default A;`, "/a.tsx"),
    ).toBeUndefined();
  });
});
