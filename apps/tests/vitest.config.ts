import { createRequire } from "node:module";
import solid from "vite-plugin-solid";
import { configDefaults, defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import path from "path";

const require = createRequire(import.meta.url);

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "solid-js/web": "@solidjs/web",
      "solid-js/store": "solid-js",
    },
    conditions: ["solid", "development", "browser"],
  },
  plugins: [solid()],
  optimizeDeps: {
    include: ["@solidjs/testing-library"],
    esbuildOptions: {
      plugins: [
        {
          name: "solid-compat",
          setup(build) {
            // Let Vite resolve @solidjs/web at runtime with proper conditions
            build.onResolve({ filter: /^solid-js\/web$/ }, () => ({
              path: "@solidjs/web",
              external: true,
            }));
            build.onResolve({ filter: /^solid-js\/store$/ }, () => ({
              path: require.resolve("solid-js"),
            }));
            // Shim onMount/onError removed in Solid v2 for @solidjs/testing-library compat
            build.onResolve({ filter: /^solid-js$/ }, args => {
              if (args.importer?.includes("@solidjs/testing-library")) {
                return { path: args.path, namespace: "solid-compat" };
              }
            });
            build.onLoad({ filter: /.*/, namespace: "solid-compat" }, () => ({
              contents: `
                export * from ${JSON.stringify(require.resolve("solid-js"))};
                export function onMount(fn) { queueMicrotask(fn); }
                export function onError() {}
              `,
              resolveDir: ".",
            }));
          },
        },
      ],
    },
  },
  test: {
    mockReset: true,
    globals: true,
    exclude: [...configDefaults.exclude, "**/src/e2e/**"],
    projects: [
      {
        // 1. NODE Project (For fs, tree-shaking, server utilities)
        extends: true,
        test: {
          include: ["src/**/*.server.test.ts"],
          name: { label: "Node Logic", color: "green" },
          environment: "node",
        },
      },
      {
        // 2. BROWSER Project (For Solid components and DOM interaction)
        extends: true,
        test: {
          // Exclude the server files, include component/browser tests
          include: ["src/**/*.{test,spec}.tsx", "src/**/*.browser.test.ts"],
          name: { label: "Browser UI", color: "cyan" },
          // Browser configuration must live inside the project's 'test' key
          browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
