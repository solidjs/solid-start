import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The `server-only` / `client-only` marker modules themselves are provided
// by vite-plugin-solid (always on inside `solid()`); what remains Start's
// responsibility is carrying the marker on its server-only entry points.
describe("boundary markers", () => {
  // Regression guard for #2068: Start's server-only entry points must carry
  // the marker so client-reachable imports of them fail loudly instead of
  // shipping server code to the browser and crashing hydration.
  it("marks Start's server-only entry points with server-only", () => {
    for (const entry of ["http/index.ts", "middleware/index.ts"]) {
      const source = readFileSync(join(import.meta.dirname, "..", entry), "utf-8");
      expect(source, `src/${entry} must import "server-only"`).toMatch(/^import "server-only";$/m);
    }
  });
});
