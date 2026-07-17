import { describe, expect, it } from "vitest";

import { treeShake } from "./tree-shake.ts";

async function shake(code: string, pick: string[]) {
  const plugin = treeShake() as any;
  const id = `/routes/route.ts?${pick.map(p => `pick=${p}`).join("&")}`;
  const result = await plugin.transform(code, id);
  return result?.code as string | undefined;
}

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
      import { db } from "./db";
      export const POST = () => db.write();
      export const GET = () => "ok";
    `;

    const output = await shake(code, ["GET"]);

    expect(output).not.toContain("db");
    expect(output).toContain("export const GET");
  });
});
