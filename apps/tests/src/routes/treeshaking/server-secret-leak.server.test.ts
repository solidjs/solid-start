import { describe, expect, it } from "vitest";
import { getBuildOutputDirs, getFiles, readFileContent } from "~/utils/build-output-utils";

// Avoid full pattern to exclude this file from scan
const SECRET_MARKER = new RegExp(`${"MyServer"}${"SuperSecretUniqueString"}\\d+`, "g");
const ALL_FILE_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs|mts|cts|css|map|gz|br)$/;

describe("server code does not leak to client bundle", () => {
  it("verifies secret markers are server-only and not in client output", async () => {
    const { sourceRoot, serverOutputRoot, clientOutputRoot } = getBuildOutputDirs();

    // Collect and validate markers from source code
    const sourceMarkerCounts = await countSourceMarkers(sourceRoot);
    expect(
      sourceMarkerCounts.size,
      `No markers found in source code: ${sourceRoot}`,
    ).toBeGreaterThan(0);
    for (const [marker, files] of sourceMarkerCounts) {
      expect(
        files.length,
        `Marker "${marker}" appears in multiple files: ${files.join(", ")}. Each marker must appear exactly once.`,
      ).toBe(1);
    }
    const markers = Array.from(sourceMarkerCounts.keys());

    // Verify markers are in server output (not DCE'd)
    const serverMarkerCounts = await countSourceMarkers(serverOutputRoot);
    for (const marker of markers) {
      // Check presence; exact count varies due to bundler duplication
      expect(
        serverMarkerCounts.has(marker),
        `Marker "${marker}" missing from server output (likely DCE'd)`,
      ).toBe(true);
    }
    expect(
      serverMarkerCounts.size,
      `Expected ${markers.length} markers, found ${serverMarkerCounts.size} in server output`,
    ).toBe(markers.length);

    // Verify no markers leak to client
    const clientMarkerCounts = await countSourceMarkers(clientOutputRoot);
    for (const [marker, files] of clientMarkerCounts) {
      expect(files.length, `Marker "${marker}" leaked to client output: ${files.join(", ")}`).toBe(
        0,
      );
    }
  });
});

async function countSourceMarkers(rootDir: string) {
  const sourceFiles = await getFiles(rootDir, ALL_FILE_EXTENSIONS);
  const markerCounts = new Map<string, string[]>();
  for (const filePath of sourceFiles) {
    const content = await readFileContent(filePath);
    for (const [marker] of content.matchAll(SECRET_MARKER)) {
      const files = markerCounts.get(marker) ?? [];
      files.push(filePath);
      markerCounts.set(marker, files);
    }
  }
  return markerCounts;
}
