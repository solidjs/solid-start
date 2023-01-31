// @ts-check

import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { nodeFileTrace } from "@vercel/nft";
import { spawn } from "child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import process from "process";
import { rollup } from "rollup";
import { fileURLToPath, pathToFileURL } from "url";

/***
 * @param {object} options
 * @param {URL} options.entry
 * @param {URL} options.outputDir
 * @param {URL} options.workingDir
 * @param {object} options.cache
 *
 */
const copyDependencies = async ({ entry, outputDir, workingDir, cache }) => {
  let base = entry;
  while (fileURLToPath(base) !== fileURLToPath(new URL("../", base))) {
    base = new URL("../", base);
  }

  const { fileList, warnings, reasons } = await nodeFileTrace([fileURLToPath(entry)], {
    cache,
    processCwd: process.cwd(),
    base: fileURLToPath(base)
  });

  // TODO: handle warnings some of them can be ignored like .env or .md files

  // TODO: handle user includes and excludes
  const results = [...fileList];

  for (const file of results) {
    // Create directories recursively
    mkdirSync(dirname(fileURLToPath(new URL(file, outputDir))), { recursive: true });

    // convert the none absolute path to absolute path
    const source = new URL(file, base);
    const target = new URL(file, outputDir);

    // TODO: handle symlinks

    copyFileSync(source, target);
  }
};

/***
 * @param {object} options
 * @param {boolean} [options.edge]
 * @param {object} [options.prerender]
 */
export default function ({ edge, prerender } = {}) {
  return {
    name: "vercel",
    async start() {
      const proc = await spawn("vercel", ["deploy", "--prebuilt"], {});
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
    },
    async build(config, builder) {
      // Vercel Build Output API v3 (https://vercel.com/docs/build-output-api/v3)
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const workingDir =
        config.root === process.cwd()
          ? pathToFileURL(config.root + "/")
          : new URL(config.root, pathToFileURL(process.cwd() + "/"));
      const vercelOutputDir = new URL("./.vercel/output/", workingDir); // join(config.root, ".vercel/output");
      const outputDir = new URL("./dist/", workingDir); // join(config.root, ".vercel/output");
      const solidServerDir = new URL("./.solid/server/", workingDir); //  join(config.root, "./.solid/server/");

      // SSR Edge Function
      if (!config.solidOptions.ssr) {
        await builder.spaClient(fileURLToPath(new URL("./static/", vercelOutputDir))); // join(outputDir, "static")
        await builder.server(fileURLToPath(solidServerDir)); // join(config.root, ".solid", "server")
      } else if (config.solidOptions.islands) {
        await builder.islandsClient(fileURLToPath(new URL("./static/", vercelOutputDir))); // join(outputDir, "static")
        await builder.server(fileURLToPath(solidServerDir)); // join(config.root, ".solid", "server")
      } else {
        await builder.client(fileURLToPath(new URL("./static/", vercelOutputDir))); // join(outputDir, "static")
        await builder.server(fileURLToPath(solidServerDir)); // join(config.root, ".solid", "server")
      }

      const entrypoint = new URL("./server.js", solidServerDir); // join(config.root, ".solid", "server", "server.js");

      let baseEntrypoint = "entry.js";
      if (edge) baseEntrypoint = "entry-edge.js";
      if (prerender) baseEntrypoint = "entry-prerender.js";
      copyFileSync(join(__dirname, baseEntrypoint), entrypoint);

      const bundle = await rollup({
        input: fileURLToPath(entrypoint),
        plugins: [
          json(),
          nodeResolve({
            preferBuiltins: true,
            exportConditions: edge ? ["worker", "solid"] : ["node", "solid"]
          }),
          common({ strictRequires: true, ...config.build.commonjsOptions })
        ]
      });

      const renderFuncEntrypoint = new URL(`./index.js`, outputDir); // join(renderFuncDir, renderEntrypoint);
      const renderFuncDir = new URL("./functions/render.func/", vercelOutputDir); // join(outputDir, "functions/render.func");
      mkdirSync(renderFuncDir, { recursive: true });
      await bundle.write(
        edge
          ? {
              format: "esm",
              file: fileURLToPath(renderFuncEntrypoint), // join(renderFuncDir, renderEntrypoint)
              inlineDynamicImports: true
            }
          : {
              format: "cjs",
              file: fileURLToPath(renderFuncEntrypoint), // join(renderFuncDir, renderEntrypoint)
              exports: "auto",
              inlineDynamicImports: true
            }
      );
      await bundle.close();

      const renderConfig = edge
        ? {
            runtime: "edge",
            entrypoint: fileURLToPath(renderFuncEntrypoint)
          }
        : {
            runtime: "nodejs16.x",
            handler: fileURLToPath(renderFuncEntrypoint),
            launcherType: "Nodejs"
          };

      const cache = Object.create(null);

      await copyDependencies({
        entry: renderFuncEntrypoint,
        outputDir: renderFuncDir,
        workingDir,
        cache
      });

      writeFileSync(
        new URL("./.vc-config.json", renderFuncDir), // join(renderFuncDir, ".vc-config.json"
        JSON.stringify(renderConfig, null, 2)
      );
      rmSync(outputDir, { recursive: true, force: true });

      // Generate API function
      const apiRoutes = config.solidOptions.router.getFlattenedApiRoutes();
      const apiRoutesConfig = apiRoutes.map(route => {
        return {
          src: route.path
            .split("/")
            .map(path =>
              path[0] === ":"
                ? `(?<${path.slice(1)}>[^/]+)`
                : path[0] === "*"
                ? `(?<${path.slice(1)}>.*)`
                : path
            )
            .join("/"),
          dest: "/api"
        };
      });
      if (apiRoutes.length > 0) {
        let baseEntrypoint = "entry.js";
        if (edge) baseEntrypoint = "entry-edge.js";
        copyFileSync(join(__dirname, baseEntrypoint), entrypoint);

        const bundle = await rollup({
          // Same as render
          input: fileURLToPath(entrypoint),
          plugins: [
            json(),
            nodeResolve({
              preferBuiltins: true,
              exportConditions: edge ? ["worker", "solid"] : ["node", "solid"]
            }),
            common({ strictRequires: true, ...config.build.commonjsOptions })
          ]
        });

        const apiFuncEntrypoint = new URL(`./index.js`, outputDir); // join(apiFuncDir, apiEntrypoint);
        const apiFuncDir = new URL("./functions/api.func/", vercelOutputDir); // join(outputDir, "functions/api.func");
        await bundle.write(
          edge
            ? {
                format: "esm",
                file: fileURLToPath(apiFuncEntrypoint), // join(apiFuncDir, apiEntrypoint)
                inlineDynamicImports: true
              }
            : {
                format: "cjs",
                file: fileURLToPath(apiFuncEntrypoint), // join(apiFuncDir, apiEntrypoint)
                exports: "auto",
                inlineDynamicImports: true
              }
        );
        await bundle.close();

        const apiConfig = edge
          ? {
              runtime: "edge",
              entrypoint: fileURLToPath(apiFuncEntrypoint)
            }
          : {
              runtime: "nodejs16.x",
              handler: fileURLToPath(apiFuncEntrypoint),
              launcherType: "Nodejs"
            };

        await copyDependencies({
          entry: apiFuncEntrypoint,
          outputDir: apiFuncDir,
          workingDir,
          cache
        });

        writeFileSync(new URL("./.vc-config.json", apiFuncDir), JSON.stringify(apiConfig, null, 2)); // join(apiFuncDir, ".vc-config.json")
        rmSync(outputDir, { recursive: true, force: true });
      }
      // Routing Config
      const outputConfig = {
        version: 3,
        routes: [
          // https://vercel.com/docs/project-configuration#project-configuration/headers
          // https://vercel.com/docs/build-output-api/v3#build-output-configuration/supported-properties/routes/source-route
          {
            src: "/assets/(.*)",
            headers: { "Cache-Control": "public, max-age=31556952, immutable" },
            continue: true
          },
          // Serve any matching static assets first
          { handle: "filesystem" },
          // Invoke the API function for API routes
          ...apiRoutesConfig,
          // Invoke the SSR function if not a static asset
          {
            src: prerender ? "/(?<path>.*)" : "/.*",
            dest: prerender ? "/render?path=$path" : "/render"
          }
        ]
      };
      writeFileSync(
        new URL("./.vc-config.json", vercelOutputDir),
        JSON.stringify(outputConfig, null, 2)
      ); //join(outputDir, "config.json")

      // prerender config
      if (prerender) {
        const prerenderConfig = {
          expiration: prerender?.expiration ?? false,
          group: 1,
          bypassToken: prerender?.bypassToken,
          allowQuery: ["path"]
        };
        writeFileSync(
          new URL("./functions/render.prerender-config.json", vercelOutputDir), //join(outputDir, "functions/render.prerender-config.json")
          JSON.stringify(prerenderConfig, null, 2)
        );
      }
    }
  };
}
