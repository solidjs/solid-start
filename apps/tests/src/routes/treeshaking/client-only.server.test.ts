import { describe, expect, it } from "vitest";
import { getBuildOutputDirs, getFiles, readFileContent } from "~/utils/build-output-utils";

// clientOnly(() => import("./_named").then(m => m.NamedClientOnly)) reads the
// export inside the loader, so the bundler can leave the module's other
// exports out of the client bundle (#2064).
describe("clientOnly with a named export", () => {
  it("bundles only the export the loader reads", async () => {
    const { clientOutputRoot } = getBuildOutputDirs();
    const files = await getFiles(clientOutputRoot, /\.js$/);
    const contents = await Promise.all(files.map(readFileContent));
    const client = contents.join("\n");

    expect(client).toContain("CLIENT_ONLY_NAMED_EXPORT_RENDERED");
    expect(client).not.toContain("CLIENT_ONLY_UNUSED_EXPORT_MARKER");
  });
});
