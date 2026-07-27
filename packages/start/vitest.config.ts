import { defineConfig } from "vitest/config";
import { VIRTUAL_MODULES } from "./src/config/constants.ts";

/**
 * Unit tests import modules like `fns/serialization.ts` directly, without the
 * `solidStart()` plugin that normally serves SolidStart's virtual modules.
 * Stand in for the ones those modules import so they resolve under vitest.
 *
 * `SEROVAL_PLUGINS_STUB` lets a spec swap in its own plugin list by writing to
 * `globalThis`, which is how the custom-plugin round-trip test works without a
 * full Vite build.
 */
function virtualModuleStubs() {
  const stubs: Record<string, string> = {
    [VIRTUAL_MODULES.serovalPlugins]: "export default globalThis.SEROVAL_PLUGINS_STUB ?? [];",
    [VIRTUAL_MODULES.getManifest]:
      "export const getManifest = () => ({ getAssets: async () => [] });",
  };
  return {
    name: "solid-start:test-virtual-module-stubs",
    resolveId(id: string) {
      if (id in stubs) return `\0${id}`;
    },
    load(id: string) {
      if (id.startsWith("\0")) return stubs[id.slice(1)];
    },
  };
}

export default defineConfig({
  plugins: [virtualModuleStubs()],
  // A few specs reach modules that import `.tsx` files for their non-JSX
  // exports. There is no Solid JSX compiler here, so point the transform at a
  // placeholder factory that is only ever parsed, never called.
  oxc: {
    jsx: { runtime: "classic", pragma: "__jsx", pragmaFrag: "__jsxFragment" },
  },
  test: {
    globals: true,
    environment: "node",
    mockReset: true,
  },
});
