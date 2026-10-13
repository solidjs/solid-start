import { describe, expect, it } from "vitest";
import { getBuildOutputDirs, getFiles, readFileContent } from "~/utils/build-output-utils";

// Regression test for https://github.com/solidjs/solid-start/issues/2327.
// ErrorBoundary statically imports the dev toolbar, whose module imports its
// CSS as a side effect. The toolbar branch is dead code in production, so the
// "sideEffects" field in @solidjs/start lets the bundler drop the module and
// its CSS. Without it, the toolbar styles leak into the client bundle.
describe("dev toolbar is excluded from the production bundle", () => {
  it("does not ship the dev toolbar CSS to the client", async () => {
    const { clientOutputRoot } = getBuildOutputDirs();
    const files = await getFiles(clientOutputRoot, /\.css(\.gz|\.br)?$/);

    expect(files.length, "No client CSS files found").toBeGreaterThan(0);

    for (const targetFile of files) {
      const css = await readFileContent(targetFile);
      expect(css, `Dev toolbar CSS leaked into: ${targetFile}`).not.toContain(
        "data-start-dev-toolbar",
      );
    }
  });
});
