import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  test: {
    mockReset: true,
    environment: "node"

    // at least one instance is required
    // browser: {
    //   provider: "playwright",
    //   enabled: true,
    //   instances: [
    //     {
    //       browser: "chromium"
    //     }
    //   ]
    // }
  }
});
