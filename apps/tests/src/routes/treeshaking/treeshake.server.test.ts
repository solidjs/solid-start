import { describe, expect, it } from "vitest";
import { getBuildOutputDirs, getFiles, readFileContent } from "~/utils/build-output-utils";

describe("Make sure treeshaking works", () => {
  it("should not have any unused code in the client-bundle", async () => {
    const { clientOutputRoot } = getBuildOutputDirs();
    const files = await getFiles(clientOutputRoot, /^\(no-side-effects\)-.*\.js(\.gz|\.br)?$/);

    expect(files.length, "No files matching the treeshaking pattern found").toBeGreaterThan(0);

    for (const targetFile of files) {
      const file = await readFileContent(targetFile);
      const result = file.includes("myTreeshakingTestUniqueString1");
      expect(result, `Unused code found in file: ${targetFile}`).toBeFalsy();
    }
  });

  it("should include side-effects code in the client-bundle", async () => {
    const { clientOutputRoot } = getBuildOutputDirs();
    const files = await getFiles(clientOutputRoot, /^side-effects.*\.js(\.gz|\.br)?$/);

    expect(files.length, "No side-effects files matching the pattern found").toBeGreaterThan(0);

    for (const targetFile of files) {
      const file = await readFileContent(targetFile);
      const result = file.includes("myTreeshakingTestUniqueString2");
      expect(result, `Side-effects code not found in file: ${targetFile}`).toBeTruthy();
    }
  });
});
