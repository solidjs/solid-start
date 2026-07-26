import { describe, expect, it } from "vitest";

import { sanitizeRouteChunkName, toRouteModuleId, treeShake } from "./tree-shake.ts";

async function shake(code: string, pick: string[]) {
  const plugin = treeShake() as any;
  const id = toRouteModuleId({ src: "/routes/route.ts", pick });
  const result = await plugin.transform(code, id);
  return result?.code as string | undefined;
}

// https://github.com/solidjs/solid-start/issues/1374
describe("toRouteModuleId", () => {
  it("ends in the source extension so extension filters still match", () => {
    const id = toRouteModuleId({ src: "/routes/index.tsx", pick: ["default", "$css"] });

    expect(id).toBe("/routes/index.tsx?pick=default&pick=$css&lang.tsx");
    // The default include filter of unplugin-auto-import, unplugin-vue-components, etc.
    expect(id).toMatch(/\.[jt]sx?$/);
  });

  it("keeps the picks parseable as query params", () => {
    const id = toRouteModuleId({ src: "/routes/api.ts", pick: ["GET", "POST"] });
    const query = new URLSearchParams(id.split("?")[1]);

    expect(query.getAll("pick")).toEqual(["GET", "POST"]);
  });

  it("uses the real extension for non-js route files", () => {
    expect(toRouteModuleId({ src: "/routes/post.md", pick: ["$css"] })).toBe(
      "/routes/post.md?pick=$css&lang.md",
    );
  });

  it("omits the suffix when the source has no extension", () => {
    expect(toRouteModuleId({ src: "/routes/route", pick: ["default"] })).toBe(
      "/routes/route?pick=default",
    );
  });
});

describe("sanitizeRouteChunkName", () => {
  it("names a route chunk after its route file, not the pick query", () => {
    const name = toRouteModuleId({ src: "index.tsx", pick: ["default", "$css"] });

    expect(sanitizeRouteChunkName(name)).toBe("index");
  });

  it("sanitizes dynamic segments the way vite does", () => {
    expect(sanitizeRouteChunkName(toRouteModuleId({ src: "[id].tsx", pick: ["default"] }))).toBe(
      "_id_",
    );
    expect(
      sanitizeRouteChunkName(toRouteModuleId({ src: "[...stories].tsx", pick: ["default"] })),
    ).toBe("_...stories_");
  });

  it("leaves non-route chunk names alone", () => {
    expect(sanitizeRouteChunkName("entry-client")).toBe("entry-client");
    expect(sanitizeRouteChunkName("some.vendor.chunk")).toBe("some.vendor.chunk");
    expect(sanitizeRouteChunkName("weird?name")).toBe("weird_name");
  });
});

describe("treeShake", () => {
  it("keeps only the picked export", async () => {
    const code = `
      export const GET = () => "get";
      export const POST = () => "post";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).toContain("export const GET");
    expect(output).not.toContain("POST");
  });

  // https://github.com/solidjs/solid-start/issues/2100
  it("keeps a non-picked export that a picked export references", async () => {
    const code = `
      export const hello = () => "hello";
      export const GET = async () => {
        return hello();
      };
    `;

    const output = await shake(code, ["GET"]);

    expect(output).toContain(`const hello = () => "hello"`);
    expect(output).not.toContain("export const hello");
    expect(output).toContain("export const GET");
  });

  it("keeps a non-picked exported function that a picked export references", async () => {
    const code = `
      export function helper() {
        return "helper";
      }
      export const GET = () => helper();
    `;

    const output = await shake(code, ["GET"]);

    expect(output).toContain("function helper()");
    expect(output).not.toContain("export function helper");
    expect(output).toContain("export const GET");
  });

  it("removes a non-picked export that nothing references", async () => {
    const code = `
      export const secret = globalThis.createSecret();
      export const GET = () => "ok";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("secret");
    expect(output).toContain("export const GET");
  });

  // https://github.com/solidjs/solid-start/issues/1659
  it("keeps picked exports declared via specifiers, including aliases", async () => {
    const code = `
      const handler = () => "ok";
      export { handler as GET, handler as POST };
    `;

    const output = await shake(code, ["GET"]);

    expect(output).toContain("handler as GET");
    expect(output).not.toContain("POST");
  });

  it("splits mixed variable declarations while preserving evaluation order", async () => {
    const code = `
      export const first = 1, GET = () => first;
    `;

    const output = await shake(code, ["GET"]);

    expect(output).toMatch(/const first = 1;\s*export const GET/);
    expect(output).not.toContain("export const first");
  });

  it("keeps a named default export that a picked export references", async () => {
    const code = `
      export default function Page() {
        return "page";
      }
      export const GET = () => Page();
    `;

    const output = await shake(code, ["GET"]);

    expect(output).toContain("function Page()");
    expect(output).not.toContain("export default");
    expect(output).toContain("export const GET");
  });

  it("removes an unreferenced default export, including anonymous ones", async () => {
    const named = await shake(
      `
        export default function Page() { return "page"; }
        export const GET = () => "ok";
      `,
      ["GET"],
    );
    expect(named).not.toContain("Page");

    const anonymous = await shake(
      `
        export default function () { return "page"; }
        export const GET = () => "ok";
      `,
      ["GET"],
    );
    expect(anonymous).not.toContain("export default");
    expect(anonymous).toContain("export const GET");
  });

  it("removes imports only used by removed exports", async () => {
    const code = `
      import { db } from "./db.ts";
      export const POST = () => db.write();
      export const GET = () => "ok";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("db");
    expect(output).toContain("export const GET");
  });

  it("removes unreachable export cycles and their imports", async () => {
    const code = `
      import { register } from "./registry.ts";
      export const first = register(() => second);
      export const second = register(() => first);
      export const GET = () => "ok";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("register");
    expect(output).not.toContain("first");
    expect(output).not.toContain("second");
    expect(output).toContain("export const GET");
  });

  it("keeps an export cycle reachable from a picked export", async () => {
    const code = `
      export const first = () => second();
      export const second = () => first();
      export const GET = () => first();
    `;

    const output = await shake(code, ["GET"]);

    expect(output).toContain("const first");
    expect(output).toContain("const second");
    expect(output).not.toContain("export const first");
    expect(output).not.toContain("export const second");
  });

  it("removes an unreachable cycle through a non-exported binding", async () => {
    const code = `
      import { register } from "./registry.ts";
      export const first = register(() => helper());
      const helper = () => first;
      export const GET = () => "ok";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("register");
    expect(output).not.toContain("first");
    expect(output).not.toContain("helper");
    expect(output).toContain("export const GET");
  });

  it("ignores type-only references when determining reachability", async () => {
    const code = `
      import { initializeSecret } from "./secret.ts";
      export const secret = initializeSecret();
      type Secret = typeof secret;
      export const GET = (_value: Secret) => "ok";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("initializeSecret");
    expect(output).not.toContain("const secret");
    expect(output).toContain("export const GET");
  });

  it("keeps runtime references wrapped in TypeScript syntax", async () => {
    const code = `
      type Handler = () => string;
      export const helper = () => "ok";
      export const GET = () => helper satisfies Handler;
    `;

    const output = await shake(code, ["GET"]);

    expect(output).toContain("const helper");
    expect(output).not.toContain("export const helper");
  });

  it("removes an unreferenced named default class", async () => {
    const code = `
      export default class Page {
        static { globalThis.initializePage(); }
      }
      export const GET = () => "ok";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("Page");
    expect(output).not.toContain("initializePage");
    expect(output).toContain("export const GET");
  });

  it("keeps a class reachable from a picked export", async () => {
    const code = `
      export class Helper {
        static value = "ok";
      }
      export const GET = () => Helper.value;
    `;

    const output = await shake(code, ["GET"]);

    expect(output).toContain("class Helper");
    expect(output).not.toContain("export class Helper");
    expect(output).toContain("export const GET");
  });

  it("removes an unreachable cycle through a non-exported class", async () => {
    const code = `
      import { register } from "./registry.ts";
      export const first = register(() => Helper);
      class Helper {
        value() { return first; }
      }
      export const GET = () => "ok";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("register");
    expect(output).not.toContain("first");
    expect(output).not.toContain("Helper");
    expect(output).toContain("export const GET");
  });

  it("preserves declare when splitting mixed variable declarations", async () => {
    const code = `
      export declare const helper: string, GET: () => string;
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("helper");
    expect(output).toContain("export declare const GET");
  });

  it("removes an unpicked var initializer when the binding is redeclared", async () => {
    const code = `
      import { initializeSecret } from "./secret.ts";
      var secret = initializeSecret();
      export var secret;
      var secret;
      export const GET = () => "ok";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("initializeSecret");
    expect(output).toContain("export const GET");
  });
});
