import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { isHtmlResponse, resolvePreviewServerEntry } from "./dev-server.ts";

const temporaryDirectories: string[] = [];

function createServerEntry(extension: "js" | "mjs") {
  const root = mkdtempSync(join(tmpdir(), "solid-start-preview-"));
  const serverDirectory = join(root, "dist/server");
  const serverEntry = join(serverDirectory, `entry-server.${extension}`);

  temporaryDirectories.push(root);
  mkdirSync(serverDirectory, { recursive: true });
  writeFileSync(serverEntry, "export default {};");

  return { root, serverEntry };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true });
  }
});

describe("resolvePreviewServerEntry", () => {
  it.each(["js", "mjs"] as const)("finds the generated .%s entry", extension => {
    const { root, serverEntry } = createServerEntry(extension);

    expect(resolvePreviewServerEntry(root)).toBe(serverEntry);
  });

  it("throws when the server entry has not been built", () => {
    const root = mkdtempSync(join(tmpdir(), "solid-start-preview-"));
    temporaryDirectories.push(root);

    expect(() => resolvePreviewServerEntry(root)).toThrow(
      `Could not find the SolidStart server entry in ${join(root, "dist/server")}`,
    );
  });
});

describe("isHtmlResponse", () => {
  it("recognizes HTML responses with content type parameters", () => {
    const response = new Response(null, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

    expect(isHtmlResponse(response)).toBe(true);
  });

  it.each(["video/mp4", "application/json"])(
    "does not identify %s responses as HTML",
    contentType => {
      const response = new Response(null, { headers: { "content-type": contentType } });

      expect(isHtmlResponse(response)).toBe(false);
    },
  );

  it("does not identify a response without a content type as HTML", () => {
    expect(isHtmlResponse(new Response())).toBe(false);
  });
});
