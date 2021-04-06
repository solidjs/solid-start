import { copyFile } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { rollup } from "rollup";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";

export default async function Node(config) {
  const { preferStreaming } = config.solidOptions;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  await Promise.all([
    vite.build({
      build: {
        outDir: "./dist/"
      }
    }),
    vite.build({
      build: {
        ssr: `solid-start/runtime/server/${
          preferStreaming ? "nodeStream" : "stringAsync"
        }/index.jsx`,
        outDir: "./.solid/server",
        rollupOptions: {
          output: {
            format: "esm"
          }
        }
      }
    })
  ]);
  await copyFile(
    join(__dirname, preferStreaming ? "entry-stream.js" : "entry-async.js"),
    join(process.cwd(), ".solid", "server", "index.js")
  );
  const bundle = await rollup({
    input: join(process.cwd(), ".solid", "server", "index.js"),
    plugins: [
      json(),
      nodeResolve()
    ]
  });
  // or write the bundle to disk
  await bundle.write({ format: "cjs", outDir: join(process.cwd(), "dist") });

  // closes the bundle
  await bundle.close();
}
