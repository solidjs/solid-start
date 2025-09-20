import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Make sure treeshaking works", () => {
  it("should not have any unused code in the client-bundle", async () => {
    const buildDir = path.resolve(process.cwd(), ".vinxi/build/client/_build/assets");
    const files = await readdir(buildDir);
    const targetFile = files.find(
      file => file.startsWith("(no-side-effects)-") && file.endsWith(".js")
    );
    if (!targetFile) {
      throw new Error("Treeshaking test: No target file not found");
    }
    const file = await readFile(path.join(buildDir, targetFile), "utf-8");

    const regex = /const a = 1;/g;
    const result = regex.test(file);

    expect(result).toBeFalsy();
  });
});
