import { describe, expect, it } from "vitest";
import { getBuildOutputDirs, getFiles } from "~/utils/build-output-utils";

describe("public assets compression", () => {
  it("includes at least one .gz and one .br file in client output", async () => {
    const { clientOutputRoot } = getBuildOutputDirs();
    const gzFiles = await getFiles(clientOutputRoot, /\.gz$/);
    const brFiles = await getFiles(clientOutputRoot, /\.br$/);

    // Only files above 1KB are compressed, so we check that at least one .gz and one .br file exists
    expect(
      gzFiles.length,
      `No .gz files found in client output: ${clientOutputRoot}`,
    ).toBeGreaterThan(0);
    expect(
      brFiles.length,
      `No .br files found in client output: ${clientOutputRoot}`,
    ).toBeGreaterThan(0);
  });
});
