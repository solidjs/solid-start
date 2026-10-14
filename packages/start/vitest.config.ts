import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // vinxi serves its route manifest only inside an app build. Specs that
      // need it mock this stub with `vi.mock("vinxi/routes")`.
      "vinxi/routes": fileURLToPath(new URL("./test/vinxi-routes.stub.ts", import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: "node",
    mockReset: true
  }
});
