import { copyFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import vite from "vite";
import { spawn } from "child_process";

export default function () {
  return {
    start(config) {
      const proc = spawn("node", ["--conditions=\"browser,node\"", "--es-module-specifier-resolution=node", "--experimental-modules", join(config.root, ".solid", "server", "index.js")]);
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
    },
    async build(config) {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      await vite.build({
        build: {
          outDir: "./dist/",
          minify: "terser",
          rollupOptions: {
            input: resolve(join(config.root, "src", `entry-client`)),
            output: {
              manualChunks: undefined
            }
          }
        }
      });
      await vite.build({
        build: {
          ssr: true,
          outDir: "./.solid/server",
          rollupOptions: {
            input: resolve(join(config.root, "src", `entry-server`)),
            output: {
              format: "esm"
            },
          }
        }
      });
      copyFileSync(
        join(config.root, ".solid", "server", `entry-server.js`),
        join(config.root, ".solid", "server", "app.js")
      );
      copyFileSync(join(__dirname, "entry.js"), join(config.root, ".solid", "server", "index.js"));
    }
  };
}
