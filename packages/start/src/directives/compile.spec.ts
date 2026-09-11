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

const serverOptions: CompileOptions = { ...clientOptions, mode: "server" };

function compileBoth(code: string, id = "/src/server-action.ts") {
  return Promise.all([compile(id, code, clientOptions), compile(id, code, serverOptions)]);
}

describe("unsupported server functions", () => {
  it("rejects a directive in an object method", async () => {
    await expect(
      compile(
        "/src/api.ts",
        `export const api = { async read() { "use server"; return 1; } };`,
        clientOptions,
      ),
    ).rejects.toThrow(/not supported in a method/);
  });

  it("rejects a directive in a class method", async () => {
    await expect(
      compile(
        "/src/api.ts",
        `export class Api { async read() { "use server"; return 1; } }`,
        clientOptions,
      ),
    ).rejects.toThrow(/not supported in a method/);
  });

  it("rejects a directive in a getter", async () => {
    await expect(
      compile(
        "/src/api.ts",
        `const api = { get value() { "use server"; return 1; } };`,
        clientOptions,
      ),
    ).rejects.toThrow(/not supported in a method/);
  });

  it("rejects a value captured from an enclosing function", async () => {
    await expect(
      compile(
        "/src/counter.ts",
        `export function makeCounter(start) {
          return async () => { "use server"; return start; };
        }`,
        clientOptions,
      ),
    ).rejects.toThrow(/"start" is declared outside/);
  });

  it("rejects a value captured from a surrounding block", async () => {
    await expect(
      compile(
        "/src/handlers.ts",
        `export function handlers(items) {
          return items.map(item => async () => { "use server"; return item; });
        }`,
        clientOptions,
      ),
    ).rejects.toThrow(/"item" is declared outside/);
  });

  it("rejects `this` in an arrow inside a class", async () => {
    await expect(
      compile(
        "/src/api.ts",
        `export class Api {
          x = 1;
          handler = async () => { "use server"; return this.x; };
        }`,
        clientOptions,
      ),
    ).rejects.toThrow(/`this` cannot be used/);
  });

  it("rejects `arguments` in an arrow inside a function", async () => {
    await expect(
      compile(
        "/src/api.ts",
        `export function outer() {
          return async () => { "use server"; return arguments.length; };
        }`,
        clientOptions,
      ),
    ).rejects.toThrow(/`arguments` cannot be used/);
  });

  it("rejects `super`", async () => {
    await expect(
      compile(
        "/src/api.ts",
        `export class Api extends Object {
          read() { return async () => { "use server"; return super.toString(); }; }
        }`,
        clientOptions,
      ),
    ).rejects.toThrow(/`super` cannot be used/);
  });

  it("rejects a private class member", async () => {
    await expect(
      compile(
        "/src/api.ts",
        `export class Api {
          #secret = 1;
          read() { return async () => { "use server"; return this.#secret; }; }
        }`,
        clientOptions,
      ),
    ).rejects.toThrow(/private class member/);
  });
});

describe("supported server functions", () => {
  it("allows module scope, globals, parameters and locals", async () => {
    const code = `
      import { db } from "./db.ts";
      const table = "users";
      export const load = async (id: string) => {
        "use server";
        const query = \`select * from \${table}\`;
        return db.run(query, id, Date.now());
      };
    `;
    const [client, server] = await compileBoth(code);
    expect(client.valid).toBe(true);
    expect(server.valid).toBe(true);
  });

  it("allows `this` and `arguments` in a function expression", async () => {
    const code = `
      export function outer() {
        return function () {
          "use server";
          return [this, arguments.length];
        };
      }
    `;
    const [client] = await compileBoth(code);
    expect(client.valid).toBe(true);
  });

  it("does not read type annotations as captured values", async () => {
    const code = `
      export function outer<T>() {
        type Local = { id: T };
        return async (value: Local): Promise<Local> => {
          "use server";
          return value;
        };
      }
    `;
    const [client] = await compileBoth(code);
    expect(client.valid).toBe(true);
  });
});

describe('"use server" modules', () => {
  it("supports an anonymous default export", async () => {
    const [client, server] = await compileBoth(
      `"use server";\nexport default async () => 1;`,
      "/src/action.ts",
    );
    expect(client.code).toContain('export { fn_1 as "default" }');
    expect(server.code).toContain("createServerReference");
    // both sides have to agree on the id
    const id = /cloneServerReference_1\("([^"]+)"\)/.exec(client.code)?.[1];
    expect(id).toBeTruthy();
    expect(server.code).toContain(`"${id}"`);
  });

  it("supports an anonymous default function declaration", async () => {
    const [client, server] = await compileBoth(
      `"use server";\nexport default async function () { return 1; }`,
      "/src/action.ts",
    );
    expect(client.code).toContain('export { fn_1 as "default" }');
    expect(server.code).toContain("createServerReference");
  });

  it("keeps ids aligned when a module exports several functions", async () => {
    const code = `"use server";
      export const first = async () => 1;
      export default async () => 2;
      export const second = async () => 3;
    `;
    const [client, server] = await compileBoth(code, "/src/actions.ts");
    const ids = [...client.code.matchAll(/cloneServerReference_1\("([^"]+)"\)/g)].map(
      match => match[1]!,
    );
    expect(ids).toHaveLength(3);
    for (const id of ids) {
      expect(server.code).toContain(`createServerReference_1("${id}"`);
    }
  });

  it("allows type-only exports", async () => {
    const code = `"use server";
      export type Session = { id: string };
      export const load = async () => 1;
    `;
    const [client] = await compileBoth(code, "/src/actions.ts");
    expect(client.valid).toBe(true);
  });

  it("reports a non-function export instead of dropping it silently", async () => {
    const result = await compile(
      "/src/actions.ts",
      `"use server";\nexport const NAME = "constant";\nexport const fn = async () => 1;`,
      clientOptions,
    );
    expect(result.code).not.toMatch(/\bNAME\b/);
    expect(result.warnings[0]).toMatch(/left out of the client build/);
  });

  it("still drops a wrapped function, which cannot be recognised statically", async () => {
    const code = `"use server";
      import { query } from "@solidjs/router";
      export const testQuery = query(() => 1, "testQuery");
    `;
    const [client] = await compileBoth(code, "/src/actions.ts");
    expect(client.code).not.toMatch(/\btestQuery\b/);
    expect(client.warnings).toHaveLength(1);
  });

  it("reports a class export", async () => {
    const result = await compile(
      "/src/actions.ts",
      `"use server";\nexport class Service {}\nexport const fn = async () => 1;`,
      clientOptions,
    );
    expect(result.warnings[0]).toMatch(/Only functions can be exported/);
  });

  it("reports a re-export", async () => {
    const result = await compile(
      "/src/actions.ts",
      `"use server";\nexport { helper } from "./helper.ts";\nexport const fn = async () => 1;`,
      clientOptions,
    );
    expect(result.warnings[0]).toMatch(/Re-exporting from another module/);
  });

  it("reports `export * from`", async () => {
    const result = await compile(
      "/src/actions.ts",
      `"use server";\nexport * from "./other.ts";\nexport const fn = async () => 1;`,
      clientOptions,
    );
    expect(result.warnings[0]).toMatch(/export \* from/);
  });

  it("reports a destructured export", async () => {
    const result = await compile(
      "/src/actions.ts",
      `"use server";\nconst obj = { a: 1, b: 2 };\nexport const { a, b } = obj;`,
      clientOptions,
    );
    expect(result.warnings[0]).toMatch(/Destructured exports/);
  });

  it("reports a non-function default export", async () => {
    const result = await compile(
      "/src/actions.ts",
      `"use server";\nexport default 42;`,
      clientOptions,
    );
    expect(result.warnings[0]).toMatch(/default export is not a function/);
  });

  it("keeps ids aligned when an unsupported export sits between two functions", async () => {
    const code = `"use server";
      export const first = async () => 1;
      export const NAME = "constant";
      export const second = async () => 2;
    `;
    const [client, server] = await compileBoth(code, "/src/actions.ts");
    const ids = [...client.code.matchAll(/cloneServerReference_1\("([^"]+)"\)/g)].map(
      match => match[1]!,
    );
    expect(ids).toHaveLength(2);
    for (const id of ids) {
      expect(server.code).toContain(`createServerReference_1("${id}"`);
    }
  });
});

describe("misplaced directives", () => {
  it("warns when the directive is not the first statement of a module", async () => {
    const result = await compile(
      "/src/actions.ts",
      `import { thing } from "./thing.ts";\n"use server";\nexport const fn = async () => thing();`,
      clientOptions,
    );
    expect(result.valid).toBe(false);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/is ignored because it is not the first statement/);
  });

  it("warns when the directive is not the first statement of a function", async () => {
    const result = await compile(
      "/src/actions.ts",
      `export const fn = async () => {
        const now = Date.now();
        "use server";
        return now;
      };`,
      clientOptions,
    );
    expect(result.valid).toBe(false);
    expect(result.warnings[0]).toMatch(/is ignored because it is not the first statement/);
  });

  it("does not warn for a correctly placed directive", async () => {
    const result = await compile(
      "/src/actions.ts",
      `export const fn = async () => { "use server"; return 1; };`,
      clientOptions,
    );
    expect(result.warnings).toHaveLength(0);
  });
});
