import { describe, expect, it } from "vitest";
import { getBuildOutputDirs, getFiles, readFileContent } from "~/utils/build-output-utils";

// Regression test for https://github.com/solidjs/solid-start/issues/2361.
// The client imports `pageRoutes`, which used to share a module with the API
// router. Building that router at module scope kept it and radix3 in the
// client bundle, even though the client has no API routes to match.
const MARKER = "Optional parameters are not supported in API routes";

describe("API router is excluded from the client bundle", () => {
  it("ships the API router to the server only", async () => {
    const { serverOutputRoot, clientOutputRoot } = getBuildOutputDirs();

    const serverFiles = await getFiles(serverOutputRoot, /\.(m?js)$/);
    const serverContents = await Promise.all(serverFiles.map(readFileContent));
    expect(
      serverContents.some(content => content.includes(MARKER)),
      "API router not found in the server output",
    ).toBe(true);

    const clientFiles = await getFiles(clientOutputRoot, /\.(m?js)$/);
    expect(clientFiles.length, "No client JS files found").toBeGreaterThan(0);
    for (const file of clientFiles) {
      const content = await readFileContent(file);
      expect(content, `API router leaked into: ${file}`).not.toContain(MARKER);
    }
  });
});
