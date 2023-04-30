// @ts-check

import common from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { nodeFileTrace } from "@vercel/nft";
import { spawn } from "child_process";
import glob from "fast-glob";
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from "fs";
import mm from "micromatch";
import { dirname, join, relative } from "path";
import process from "process";
import { rollup } from "rollup";
import { fileURLToPath, pathToFileURL } from "url";
import { normalizePath } from "vite";

const emptyDir = dir => {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
};

/***
 * @param {object} options
 * @param {URL} options.entry
 * @param {URL} options.outputDir
 * @param {URL} options.workingDir
 * @param {string | string[] | undefined} options.includes
 * @param {string | string[] | undefined} options.excludes
 * @param {URL} options. workingDir
 * @param {object} options.cache
 *
 * @returns {Promise<URL>} returns the base directory used for the nft within the outputDir
 * Implemtation based on astro vercel adapter https://github.com/withastro/astro/blob/474ecc7be625a0ff2e9bc145af948e75826de025/packages/integrations/vercel/src/lib/nft.ts#L7
 *
 */
const copyDependencies = async ({ entry, outputDir, includes, excludes, workingDir, cache }) => {
  let base = entry;
  while (fileURLToPath(base) !== fileURLToPath(new URL("../", base))) {
    base = new URL("../", base);
  }

  const { fileList, warnings, reasons } = await nodeFileTrace([fileURLToPath(entry)], {
    cache,
    processCwd: fileURLToPath(workingDir),
    base: fileURLToPath(base)
  });

  for (const error of warnings) {
    if (error.message.startsWith("Failed to resolve dependency")) {
      const match = /Cannot find module '(.+?)' loaded from (.+)/.exec(error.message);
      const [, module, file] = match ? match : [];
      if (fileURLToPath(entry) === file) {
        console.warn(
          `[solid-start-vercel] The module "${module}" couldn't be resolved. This may not be a problem, but it's worth checking.`
        );
      } else {
        console.warn(
          `[solid-start-vercel] The module "${module}" inside the file "${file}" couldn't be resolved. This may not be a problem, but it's worth checking.`
        );
      }
    }
  }

  if (includes) {
    const entries = glob
      .sync(includes, { cwd: fileURLToPath(workingDir) })
      .map(p => relative(fileURLToPath(base), fileURLToPath(new URL(p, workingDir))));
    // dedup the entries from what nft finds
    for (const entry of entries) {
      fileList.add(entry);
    }
  }

  let results = [...fileList];

  if (excludes) {
    results = mm.not(results, excludes, { dot: true });
  }

  for (const file of results) {
    // convert the relative path to absolute path
    const source = new URL(file, base);
    const target = new URL(file, outputDir);
    const stats = lstatSync(source);

    // Create directories recursively
    mkdirSync(dirname(fileURLToPath(target)), {
      recursive: true
    });

    if (stats.isSymbolicLink()) {
      const realPath = realpathSync(source);
      const realdest = new URL(relative(fileURLToPath(base), realPath), outputDir);

      symlinkSync(
        relative(dirname(fileURLToPath(target)), fileURLToPath(realdest)),
        target,
        "file"
      );
    } else {
      copyFileSync(source, target);
    }
  }

  return base;
};

/***
 * @param {object} options
 * @param {boolean} [options.edge]
 * @param {object} [options.prerender]
 * @param {string | string[]} [options.includes]
 * @param {string | string[]} [options.excludes]
 */
export default function ({ edge, prerender, includes, excludes } = {}) {
  return {
    name: "vercel",
    async start() {
      const proc = await spawn("vercel", ["deploy", "--prebuilt"], {});
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);
    },
    async build(config, builder) {
      const ssrExternal = config?.ssr?.external || [];
      // Vercel Build Output API v3 (https://vercel.com/docs/build-output-api/v3)
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const workingDir =
        config.root === normalizePath(process.cwd())
          ? pathToFileURL(config.root + "/")
          : new URL(config.root, pathToFileURL(normalizePath(process.cwd()) + "/"));
      const vercelOutputDir = new URL("./.vercel/output/", workingDir); // join(config.root, ".vercel/output");
      const outputDir = new URL("./dist/", workingDir); // join(config.root, ".vercel/output");
      const solidServerDir = new URL("./.solid/server/", workingDir); //  join(config.root, "./.solid/server/");

      // start with fresh directories
      emptyDir(vercelOutputDir);
      emptyDir(outputDir);
      emptyDir(solidServerDir);

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
        ],
        external: ssrExternal
      });

      const renderFuncEntrypoint = new URL(`./index.${edge ? "mjs" : "cjs"}`, outputDir); // join(renderFuncDir, renderEntrypoint);
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

      const cache = Object.create(null);
      const renderBaseUrl = await copyDependencies({
        entry: renderFuncEntrypoint,
        outputDir: renderFuncDir,
        includes,
        excludes,
        workingDir,
        cache
      });
      const renderConfig = edge
        ? {
            runtime: "edge",
            entrypoint: relative(fileURLToPath(renderBaseUrl), fileURLToPath(renderFuncEntrypoint))
          }
        : {
            runtime: "nodejs16.x",
            handler: relative(fileURLToPath(renderBaseUrl), fileURLToPath(renderFuncEntrypoint)),
            launcherType: "Nodejs"
          };

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
          ],
          external: ssrExternal
        });

        const apiFuncEntrypoint = new URL(`./index.${edge ? "mjs" : "cjs"}`, outputDir); // join(apiFuncDir, apiEntrypoint);
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

        const apiBaseUrl = await copyDependencies({
          entry: apiFuncEntrypoint,
          outputDir: apiFuncDir,
          includes,
          excludes,
          workingDir,
          cache
        });
        const apiConfig = edge
          ? {
              runtime: "edge",
              entrypoint: relative(fileURLToPath(apiBaseUrl), fileURLToPath(apiFuncEntrypoint))
            }
          : {
              runtime: "nodejs16.x",
              handler: relative(fileURLToPath(apiBaseUrl), fileURLToPath(apiFuncEntrypoint)),
              launcherType: "Nodejs"
            };

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
        new URL("./config.json", vercelOutputDir),
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
