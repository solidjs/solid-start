import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { normalizePath } from "vite";
import { afterEach, describe, expect, it, vi } from "vitest";

import { findStylesInModuleGraph } from "./collect-styles.ts";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("findStylesInModuleGraph", () => {
  it("resolves the id against the root when the working directory is a link to it", async () => {
    const root = join(tmpdir(), "solid-start-app");
    vi.spyOn(process, "cwd").mockReturnValue(join(tmpdir(), "solid-start-link"));
    const page = resolve(root, "src/routes/page.tsx");
    const style = resolve(root, "src/routes/page.css");
    const modules: Record<string, object> = {
      [page]: {
        id: page,
        url: "/src/routes/page.tsx",
        file: page,
        transformResult: { deps: [style] },
      },
      [style]: { id: style, url: "/src/routes/page.css", file: style },
    };
    const environment = {
      config: { root: normalizePath(root) },
      fetchModule: async (file: string) => (file in modules ? { id: file } : {}),
      moduleGraph: { getModuleById: (id: string) => modules[id] },
    } as any;

    const styles = await findStylesInModuleGraph(environment, "src/routes/page.tsx", () => true);

    expect(styles).toEqual({ [style]: "/src/routes/page.css" });
  });
});
