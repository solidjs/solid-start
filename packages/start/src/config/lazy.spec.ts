import { describe, expect, it } from "vitest";

import lazy from "./lazy.ts";

async function transform(code: string, id = `${process.cwd()}/src/routes/page.tsx`) {
  const plugin = lazy() as any;
  const context = { environment: { name: "ssr" } };
  return plugin.transform.call(context, code, id);
}

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
