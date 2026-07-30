import { describe, expect, it } from "vitest";
import { compile, type CompileOptions } from "./compile.ts";

const clientOptions: CompileOptions = {
  env: "development",
  mode: "client",
  directive: "use server",
  definitions: {
    register: {
      kind: "named",
      name: "createServerReference",
      source: "virtual:server-runtime",
    },
    clone: {
      kind: "named",
      name: "cloneServerReference",
      source: "virtual:server-runtime",
    },
  },
};

describe("compile", () => {
  it("removes an import when only type specifiers remain", async () => {
    const result = await compile(
      "/src/server-action.ts",
      `
        import { type Session, verify } from "./server-module.ts";

        export const serverAction = async (): Promise<Session | null> => {
          "use server";
          return verify();
        };
      `,
      clientOptions,
    );

    expect(result.valid).toBe(true);
    expect(result.code).not.toContain("./server-module.ts");
  });

  it("preserves live value specifiers from a mixed import", async () => {
    const result = await compile(
      "/src/server-action.ts",
      `
        import { type Session, clientValue, verify } from "./server-module.ts";

        export const value = clientValue;
        export const serverAction = async (): Promise<Session | null> => {
          "use server";
          return verify();
        };
      `,
      clientOptions,
    );

    expect(result.valid).toBe(true);
    expect(result.code).toContain(
      'import { type Session, clientValue } from "./server-module.ts";',
    );
    expect(result.code).not.toMatch(/\bverify\b/);
  });
});
