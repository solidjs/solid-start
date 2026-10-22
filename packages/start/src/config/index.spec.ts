import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ConfigEnv, Plugin, UserConfig } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { solidStart } from "./index.ts";

let root: string;

beforeEach(() => {
  root = realpathSync.native(mkdtempSync(join(tmpdir(), "solid-start-config-")));
  mkdirSync(join(root, "src/routes"), { recursive: true });
  writeFileSync(join(root, "src/app.tsx"), "export default () => null;");
  vi.spyOn(process, "cwd").mockReturnValue(root);
  // the build branch of the config hook collects route entries from here
  vi.stubGlobal("ROUTERS", { client: { getRoutes: async () => [] } });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  rmSync(root, { recursive: true, force: true });
});

/** The `SERVER_BASE_URL` the `solid-start:config` plugin defines for a user config. */
async function serverBaseUrl(config: UserConfig, command: ConfigEnv["command"] = "build") {
  const plugin = solidStart()
    .flat()
    .find(
      (p): p is Plugin =>
        !!p && typeof p === "object" && "name" in p && p.name === "solid-start:config",
    );
  const hook = plugin!.config as (config: UserConfig, env: ConfigEnv) => Promise<UserConfig>;
  const mode = command === "build" ? "production" : "development";
  const resolved = await hook(config, { command, mode });

  return JSON.parse(resolved.define!["import.meta.env.SERVER_BASE_URL"] as string) as string;
}

describe("SERVER_BASE_URL", () => {
  const commands: ConfigEnv["command"][] = ["build", "serve"];

  it.each(commands)("defaults to the root (%s)", async command => {
    await expect(serverBaseUrl({}, command)).resolves.toBe("/");
  });

  it.each(commands)("follows a path-only Vite base (%s)", async command => {
    await expect(serverBaseUrl({ base: "/app/" }, command)).resolves.toBe("/app/");
  });

  it.each(commands)("adds the leading slash Vite adds (%s)", async command => {
    await expect(serverBaseUrl({ base: "app/" }, command)).resolves.toBe("/app/");
  });

  it.each(commands)("maps a relative Vite base to the root (%s)", async command => {
    await expect(serverBaseUrl({ base: "./" }, command)).resolves.toBe("/");
    await expect(serverBaseUrl({ base: "" }, command)).resolves.toBe("/");
  });

  it.each(commands)("maps an external Vite base to the root (%s)", async command => {
    const cdn = { base: "https://cdn.example.com/some/prefix/" };

    await expect(serverBaseUrl(cdn, command)).resolves.toBe("/");
    await expect(serverBaseUrl({ base: "//cdn.example.com/" }, command)).resolves.toBe("/");
  });

  it("prefers an explicit server.baseURL", async () => {
    const config = { base: "https://cdn.example.com/", server: { baseURL: "/app/" } } as UserConfig;

    await expect(serverBaseUrl(config)).resolves.toBe("/app/");
  });

  it("wraps server.baseURL in slashes", async () => {
    const config = { server: { baseURL: "app" } } as UserConfig;

    await expect(serverBaseUrl(config)).resolves.toBe("/app/");
  });

  it.each(commands)("adds the trailing slash a Vite base may lack (%s)", async command => {
    await expect(serverBaseUrl({ base: "/app" }, command)).resolves.toBe("/app/");
  });
});

describe("resolve conditions", () => {
  async function resolveEnvironments(command: ConfigEnv["command"] = "serve") {
    const { resolveConfig } = await import("vite");
    const config = await resolveConfig(
      { root, logLevel: "silent", plugins: [solidStart()] },
      command,
      command === "build" ? "production" : "development",
    );
    return config.environments;
  }

  it("keeps Vite's client conditions", async () => {
    const { client } = await resolveEnvironments();

    expect(client.resolve.conditions).toEqual(expect.arrayContaining(["module", "browser"]));
    expect(client.resolve.conditions).not.toContain("generic");
  });

  it("resolves the server to runtime-agnostic builds", async () => {
    const { ssr } = await resolveEnvironments();

    expect(ssr.resolve.conditions).toContain("generic");
    expect(ssr.resolve.conditions).not.toContain("node");
  });

  it("pre-bundles the dev overlay's dependencies in dev only", async () => {
    const dev = await resolveEnvironments("serve");
    const build = await resolveEnvironments("build");

    expect(dev.client.optimizeDeps.include).toContain("@solidjs/start > @jridgewell/trace-mapping");
    expect(build.client.optimizeDeps.include ?? []).not.toContain(
      "@solidjs/start > @jridgewell/trace-mapping",
    );
  });
});

describe("START_BUILD_ID", () => {
  async function buildId(
    options: Parameters<typeof solidStart>[0],
    command: ConfigEnv["command"] = "build",
  ) {
    const plugin = solidStart(options)
      .flat()
      .find(
        (p): p is Plugin =>
          !!p && typeof p === "object" && "name" in p && p.name === "solid-start:config",
      );
    const hook = plugin!.config as (config: UserConfig, env: ConfigEnv) => Promise<UserConfig>;
    const mode = command === "build" ? "production" : "development";
    const resolved = await hook({}, { command, mode });
    return JSON.parse(resolved.define!["import.meta.env.START_BUILD_ID"] as string) as string;
  }

  it("is empty when skew protection is off", async () => {
    await expect(buildId(undefined)).resolves.toBe("");
  });

  it("is empty in dev", async () => {
    await expect(buildId({ serverFunctions: { skewProtection: true } }, "serve")).resolves.toBe("");
  });

  it("is random per build", async () => {
    const a = await buildId({ serverFunctions: { skewProtection: true } });
    const b = await buildId({ serverFunctions: { skewProtection: true } });
    expect(a).not.toBe("");
    expect(a).not.toBe(b);
  });

  it("uses the configured build ID", async () => {
    await expect(
      buildId({ serverFunctions: { skewProtection: { buildId: "abc123" } } }),
    ).resolves.toBe("abc123");
  });
});
