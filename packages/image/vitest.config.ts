import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [
    solid({ ssr: true }),
    // vite-plugin-solid automatically injects @testing-library/jest-dom into
    // setupFiles when it detects the module in pnpm's store. Because the image
    // package does not depend on jest-dom, the import fails at runtime.
    // Strip the injected entry so vitest never tries to load it.
    {
      name: "strip-jest-dom-setup",
      config(config) {
        const files = config.test?.setupFiles;
        if (Array.isArray(files)) {
          config.test!.setupFiles = files.filter(
            (f) => typeof f !== "string" || !f.includes("jest-dom"),
          );
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: "node",
  },
});
