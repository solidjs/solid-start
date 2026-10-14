import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

// clientOnly(() => import("./_named").then(({ NamedClientOnly }) => NamedClientOnly))
// reads the export inside the loader, so the bundler can leave the module's other
// exports out of the client bundle (#2064).
describe("clientOnly with a named export", () => {
  it("bundles only the export the loader reads", async () => {
    const buildDir = path.resolve(process.cwd(), ".vinxi/build/client/_build/assets");
    const files = (await readdir(buildDir)).filter(file => file.endsWith(".js"));
    const contents = await Promise.all(
      files.map(file => readFile(path.join(buildDir, file), "utf-8"))
    );
    const client = contents.join("\n");

    expect(client).toContain("CLIENT_ONLY_NAMED_EXPORT_RENDERED");
    expect(client).not.toContain("CLIENT_ONLY_UNUSED_EXPORT_MARKER");
  });
});
