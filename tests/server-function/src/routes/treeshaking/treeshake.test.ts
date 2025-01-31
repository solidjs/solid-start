import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Make sure treeshaking works", () => {
  it("should not have any unused code in the client-bundle", async () => {
    const file = await readFile(
      path.resolve(
        process.cwd(),
        ".vinxi/build/client/_build/assets/(no-side-effects)-CWH8W1AF.js"
      ),
      "utf-8"
    );

    const regex = /const a = 1;/g;
    const result = regex.test(file);

    expect(result).toBeFalsy();
  });
});
