import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createServer,
  type DevEnvironment,
  type EnvironmentModuleNode,
  type HotUpdateOptions,
  normalizePath,
  type Plugin,
  type ViteDevServer,
} from "vite";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VITE_ENVIRONMENTS } from "./constants.ts";
import { isHtmlResponse, resolvePreviewServerEntry, serverOnlyReload } from "./dev-server.ts";

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

const servers: ViteDevServer[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => server.close()));
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

describe("serverOnlyReload", () => {
  /** An app whose middleware is configured without a file extension */
  async function createApp() {
    const root = realpathSync.native(mkdtempSync(join(tmpdir(), "solid-start-server-reload-")));
    temporaryDirectories.push(root);

    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "package.json"), '{ "type": "module" }');
    for (const file of ["entry-server.tsx", "middleware.ts", "app.tsx"]) {
      writeFileSync(join(root, "src", file), "export default {};");
    }

    const plugin = serverOnlyReload("./src/entry-server.tsx", "./src/middleware") as Plugin;
    const server = await createServer({
      configFile: false,
      logLevel: "silent",
      root,
      server: { middlewareMode: true },
      plugins: [plugin],
    });
    servers.push(server);

    const send = vi.spyOn(server.environments[VITE_ENVIRONMENTS.client]!.hot, "send");
    const hotUpdate = plugin.hotUpdate as (
      this: { environment: DevEnvironment },
      options: HotUpdateOptions,
    ) => Promise<void>;

    /** Stands in for Vite calling the hook when a watched file changes */
    const change = (
      file: string,
      { environment = VITE_ENVIRONMENTS.server, inGraph = true } = {},
    ) =>
      hotUpdate.call(
        { environment: server.environments[environment]! },
        {
          type: "update",
          file: normalizePath(join(root, file)),
          timestamp: Date.now(),
          modules: inGraph ? [{} as EnvironmentModuleNode] : [],
          read: async () => "",
          server,
        },
      );

    return { change, send };
  }

  it.each(["src/entry-server.tsx", "src/middleware.ts"])(
    "reloads the browser when %s changes",
    async file => {
      const { change, send } = await createApp();

      await change(file);

      await vi.waitFor(() => expect(send).toHaveBeenCalledWith({ type: "full-reload" }));
    },
  );

  it("leaves every other change to Vite's own HMR", async () => {
    const { change, send } = await createApp();

    // Also rendered on the client, so the client environment updates it
    await change("src/app.tsx");
    // Already handled by the environment the change was reported for
    await change("src/entry-server.tsx", { environment: VITE_ENVIRONMENTS.client });
    // Nothing was rendered from it, so there is nothing to see
    await change("src/entry-server.tsx", { inGraph: false });

    // Longer than the debounce the reload is coalesced with
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(send).not.toHaveBeenCalled();
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
