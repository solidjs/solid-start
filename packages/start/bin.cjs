#!/usr/bin/env node
"use strict";

const { exec, spawn } = require("child_process");
const sade = require("sade");
const { resolve, join, relative } = require("path");
const path = require("path");
const c = require("picocolors");
const {
  readFileSync,
  writeFileSync,
  existsSync,
  renameSync,
  mkdirSync,
  copyFileSync
} = require("fs");
const waitOn = require("wait-on");
const pkg = require(join(__dirname, "package.json"));
const DEBUG = require("debug")("start");
globalThis.DEBUG = DEBUG;

const prog = sade("solid-start").version("beta");

const findAny = (path, name) => {
  for (var ext of [".js", ".ts", ".mjs", ".mts"]) {
    const file = join(path, name + ext);
    if (existsSync(file)) {
      return file;
    }
  }
  return null;
};

prog
  .command("routes").describe("Show all routes in your app")
  .action(async ({ config: configFile, open, port, root, host, inspect }) => {
    root = root || process.cwd();
    const config = await resolveConfig({ mode: "production", configFile, root, command: "build" });

    const { Router } = await import("./fs-router/router.js");

    const router = new Router({
      baseDir: path.posix.join(config.solidOptions.appRoot, config.solidOptions.routesDir),
      pageExtensions: config.solidOptions.pageExtensions,
      ignore: config.solidOptions.routesIgnore,
      cwd: config.solidOptions.root
    });
    await router.init();

    console.log(JSON.stringify(router.getFlattenedPageRoutes(), null, 2));
  });

prog
  .command("dev")
  .describe("Start a development server")
  .option("-o, --open", "Open a browser tab", false)
  .option("-r --root", "Root directory")
  .option("-c, --config", "Vite config file")
  .option("-i,--inspect", "Node inspector", false)
  .option("-p, --port", "Port to start server on")
  .action(async ({ config: configFile, open, port, root, host, inspect }) => {
    console.log(c.bgBlue(" solid-start dev "));
    console.log(c.magenta(" version "), pkg.version);

    root = root || process.cwd();

    const config = await resolveConfig({ configFile, root, mode: "development", command: "serve" });

    port || (port = config.server.port || 3000);
    config.adapter.name && console.log(c.blue(" adapter "), config.adapter.name);

    DEBUG(
      [
        "running",
        "vite",
        "--experimental-vm-modules",
        inspect ? "--inspect" : undefined,
        "node_modules/vite/bin/vite.js",
        "dev",
        ...(root ? [root] : []),
        ...(config ? ["--config", `"${config.configFile}"`] : []),
        ...(port ? ["--port", port] : []),
        ...(host ? ["--host"] : [])
      ]
        .filter(Boolean)
        .join(" ")
    );
    spawn(
      "vite",
      [
        "dev",
        ...(config ? ["--config", `"${config.configFile}"`] : []),
        ...(port ? ["--port", port] : []),
        ...(host ? ["--host"] : [])
      ].filter(Boolean),
      {
        shell: true,
        stdio: "inherit",
        env: {
          ...process.env,
          NODE_OPTIONS: [
            process.env.NODE_OPTIONS,
            "--experimental-vm-modules",
            inspect ? "--inspect" : "",
          ]
            .filter(Boolean)
            .join(" "),
        }
      }
    );

    if (open) setTimeout(() => launch(port), 1000);
  });

prog
  .command("build")
  .option("-r --root", "Root directory")
  .option("-c, --config", "Vite config file")
  .describe("Create production build")
  .action(async ({ root, config: configFile }) => {
    console.log(c.bgBlue(" solid-start build "));
    console.log(c.magenta(" version "), pkg.version);

    const config = await resolveConfig({ configFile, root, mode: "production", command: "build" });

    const { default: prepareManifest } = await import("./fs-router/manifest.js");

    const inspect = join(config.root, ".solid", "inspect");
    if (!existsSync(inspect)) mkdirSync(inspect, {
      recursive: true
    });

    const vite = await import("vite");
    config.adapter.name && console.log(c.blue(" adapter "), config.adapter.name);

    config.adapter.build(config, {
      islandsClient: async outputDir => {
        console.log();
        console.log(c.blue("solid-start") + c.magenta(" finding islands..."));
        console.time(c.blue("solid-start") + c.magenta(" found islands in"));

        let routeManifestPath = join(config.root, ".solid", "route-manifest");
        let islands = new Set();
        await vite.build({
          build: {
            outDir: routeManifestPath,
            ssrManifest: true,
            minify: process.env.START_MINIFY === "false" ? false : config.build?.minify ?? true,
            rollupOptions: {
              input: [
                resolve(join(config.root, "node_modules", "solid-start", "islands", "entry-client"))
              ],
              output: {
                manualChunks(id, i) {
                  if (id.includes("?island")) {
                    islands.add(id);
                    return path.basename(id);
                  }
                }
              }
            }
          }
        });

        let assetManifest = JSON.parse(
          readFileSync(join(routeManifestPath, "manifest.json")).toString()
        );
        let ssrManifest = JSON.parse(
          readFileSync(join(routeManifestPath, "ssr-manifest.json")).toString()
        );

        writeFileSync(
          join(routeManifestPath, "route-manifest.json"),
          JSON.stringify(prepareManifest(ssrManifest, assetManifest, config), null, 2)
        );

        let routeManifest = JSON.parse(
          readFileSync(join(routeManifestPath, "route-manifest.json")).toString()
        );

        let islandReferences = Object.keys(routeManifest).filter(
          a => a.includes("?island") || a.includes("?client") || a.includes("_island")
        );

        let islandToReference = {};
        let referenceToIsland = {};
        for (let island of islands) {
          let name = path.basename(island);
          let reference = islandReferences.find(a =>
            a.match(new RegExp(`_${name.replace("?", "_").replace("&", "_")}.*`))
          );
          if (reference) {
            islandToReference[vite.normalizePath(relative(config.root, island))] = reference;
            referenceToIsland[reference] = vite.normalizePath(relative(config.root, island));
          }
        }

        console.log(islandReferences);

        console.timeEnd(c.blue("solid-start") + c.magenta(" found islands in"));
        console.log();
        console.log(c.blue("solid-start") + c.magenta(" building islands client..."));
        console.time(c.blue("solid-start") + c.magenta(" built islands client in"));
        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            outDir: outputDir,
            ssrManifest: true,
            minify: process.env.START_MINIFY === "false" ? false : config.build?.minify ?? true,
            rollupOptions: {
              input: [
                config.solidOptions.clientEntry,
                ...[...islands.values()].map(i => resolve(i))
              ],
              output: {
                manualChunks: undefined
              }
            }
          }
        });

        assetManifest = JSON.parse(readFileSync(join(outputDir, "manifest.json")).toString());
        ssrManifest = JSON.parse(readFileSync(join(outputDir, "ssr-manifest.json")).toString());

        let islandsManifest = prepareManifest(ssrManifest, assetManifest, config, [
          ...Object.keys(islandToReference)
        ]);

        let newManifest = {
          ...Object.fromEntries(
            Object.entries(routeManifest)
              .filter(([k]) => k.startsWith("/") || k === "")
              .map(([k, v]) => [
                k,
                {
                  type: "route",
                  script: v.script,
                  assets: v.assets
                    .filter(a => a.type !== "script")
                    // replace island references with island source paths
                    .map(v => (v.type === "island" ? { ...v, href: referenceToIsland[v.href] } : v))
                }
              ])
          ),
          ...Object.fromEntries(
            Object.entries(islandsManifest)
              .filter(
                ([k]) => k.includes("?island") || k.includes("?client") || k.includes("_island")
              )
              .map(([k, v]) => [
                k,
                {
                  type: "island",
                  script: v.script,
                  assets: [
                    ...v.assets.filter(a => a.type === "script"),
                    // load assets via reference tags
                    ...routeManifest[islandToReference[k]].assets.filter(a => a.type === "style")
                  ]
                }
              ])
          ),
          "entry-client": {
            type: "entry",
            script: islandsManifest["entry-client"].script,
            assets: [
              ...islandsManifest["entry-client"].assets.filter(a => a.type === "script"),
              ...routeManifest["entry-client"].assets.filter(a => a.type === "style")
            ]
          }
        };

        Object.values(newManifest).forEach(v => {
          let assets = Array.isArray(v) ? v : v.assets;
          assets.forEach(a => {
            if (a.type === "style") {
              copyFileSync(join(routeManifestPath, a.href), join(outputDir, a.href));
            }
          });
        });

        writeFileSync(join(outputDir, "route-manifest.json"), JSON.stringify(newManifest, null, 2));
        writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(newManifest, null, 2));
        writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
        writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));
        console.timeEnd(c.blue("solid-start") + c.magenta(" built islands client in"));
      },
      server: async path => {
        console.log();
        console.log(c.blue("solid-start") + c.magenta(" building server..."));
        console.time(c.blue("solid-start") + c.magenta(" server built in"));
        const ssrExternal = config?.ssr?.external || [];
        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            ssr: true,
            outDir: path,
            rollupOptions: {
              input: config.solidOptions.serverEntry,
              external: ssrExternal,
            }
          }
        });
        console.timeEnd(c.blue("solid-start") + c.magenta(" server built in"));
        console.log("");
      },
      client: async path => {
        console.log();
        console.log(c.blue("solid-start") + c.magenta(" building client..."));
        console.time(c.blue("solid-start") + c.magenta(" client built in"));
        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            outDir: path,
            ssrManifest: true,
            minify: process.env.START_MINIFY === "false" ? false : config.build?.minify ?? true,
            rollupOptions: {
              input: config.solidOptions.clientEntry,
              output: {
                manualChunks: undefined
              }
            }
          }
        });

        let assetManifest = JSON.parse(readFileSync(join(path, "manifest.json")).toString());
        let ssrManifest = JSON.parse(readFileSync(join(path, "ssr-manifest.json")).toString());

        let routeManifest = prepareManifest(ssrManifest, assetManifest, config);
        writeFileSync(join(path, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));

        writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));
        writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
        writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));
        console.timeEnd(c.blue("solid-start") + c.magenta(" client built in"));
      },
      debug: DEBUG,
      build: async conf => {
        return await vite.build({
          configFile: config.configFile,
          root: config.root,
          ...conf
        });
      },
      spaClient: async path => {
        console.log();
        console.log(c.blue("solid-start") + c.magenta(" building client..."));
        console.time(c.blue("solid-start") + c.magenta(" client built in"));

        let isDebug = process.env.DEBUG && process.env.DEBUG.includes("start");

        let indexHtml;
        if (existsSync(join(config.root, "index.html"))) {
          indexHtml = join(config.root, "index.html");
        } else {
          DEBUG("starting vite server for index.html");
          console.log(c.blue("solid-start") + c.magenta(" rendering index.html..."));
          console.time(c.blue("solid-start") + c.magenta(" index.html rendered in"));
          let port = await (await import("get-port")).default();
          let proc = spawn(
            "vite",
            [
              "dev",
              "--mode",
              "production",
              ...(config ? ["--config", `"${config.configFile}"`] : []),
              ...(port ? ["--port", port] : [])
            ],
            {
              stdio: isDebug ? "inherit" : "ignore",
              shell: true,
              env: {
                ...process.env,
                START_INDEX_HTML: "true",
                NODE_OPTIONS: [
                  process.env.NODE_OPTIONS,
                  "--experimental-vm-modules",
                ]
                  .filter(Boolean)
                  .join(" "),
              },
              detached: process.platform !== 'win32'
            }
          );

          const terminateShell = () => {
            if (process.platform === 'win32') proc.kill()
            else process.kill(-proc.pid);
          }

          process.on("SIGINT", function () {
            terminateShell()
            process.exit();
          });

          await waitOn({
            resources: [`http://localhost:${port}/`],
            verbose: isDebug
          });

          DEBUG("started vite server for index.html");

          writeFileSync(
            join(config.root, ".solid", "index.html"),
            await (
              await import("./dev/create-index-html.js")
            ).createHTML(`http://localhost:${port}/`)
          );

          indexHtml = join(config.root, ".solid", "index.html");

          DEBUG("spa index.html created");
          console.timeEnd(c.blue("solid-start") + c.magenta(" index.html rendered in"));

          terminateShell()
        }

        DEBUG("building client bundle");

        process.env.START_SPA_CLIENT = "true";
        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            outDir: path,
            minify: process.env.START_MINIFY == "false" ? false : config.build?.minify ?? true,
            ssrManifest: true,
            rollupOptions: {
              input: indexHtml,
              output: {
                manualChunks: undefined
              }
            }
          }
        });
        process.env.START_SPA_CLIENT = "false";

        if (indexHtml === join(config.root, ".solid", "index.html")) {
          renameSync(join(path, ".solid", "index.html"), join(path, "index.html"));
        }

        DEBUG("built client bundle");

        let assetManifest = JSON.parse(readFileSync(join(path, "manifest.json")).toString());
        let ssrManifest = JSON.parse(readFileSync(join(path, "ssr-manifest.json")).toString());
        let routeManifest = prepareManifest(ssrManifest, assetManifest, config);

        writeFileSync(join(path, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));

        writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));
        writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
        writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));

        DEBUG("wrote route manifest");
        console.timeEnd(c.blue("solid-start") + c.magenta(" client built in"));
      }
    });
  });

prog
  .command("start")
  .option("-r --root", "Root directory")
  .option("-c, --config", "Vite config file")
  .option(
    "-p, --port",
    "Port to start server on (doesn't work with all adapters)",
    process.env.PORT ? process.env.PORT : "3000"
  )
  .describe("Start production build")
  .action(async ({ root, config: configFile, port }) => {
    console.log(c.bgBlue(" solid-start start "));
    console.log(c.magenta(" version "), pkg.version);

    const config = await resolveConfig({ mode: "production", configFile, root, command: "build" });

    let url = await config.adapter.start(config, { port });
    config.adapter.name && console.log(c.blue(" adapter "), config.adapter.name);
    console.log();
    if (url) {
      const { default: printUrls } = await import("./dev/print-routes.js");
      await config.solidOptions.router.init();
      printUrls(config.solidOptions.router, url);
    }
  });

prog.parse(process.argv);

/**
 * @param {*} param0
 * @returns {Promise<import('./vite/plugin').ViteConfig>}
 */
async function resolveConfig({ configFile, root, mode, command }) {
  const vite = await import("vite");
  root = root || process.cwd();
  if (!configFile) {
    if (!configFile) {
      configFile = findAny(root, "start.config");
    }
    if (!configFile) {
      configFile = findAny(root, "vite.config");
    }

    if (!configFile) {
      configFile = join(__dirname, "vite", "config.js");
    }
    DEBUG('config file: "%s"', configFile);
  }

  let config = await vite.resolveConfig({ mode, configFile, root }, command, mode, mode);

  async function resolveAdapter(config) {
    if (typeof config.solidOptions.adapter === "string") {
      return (await import(config.solidOptions.adapter)).default();
    } else if (Array.isArray(config.solidOptions.adapter)) {
      return (await import(config.solidOptions.adapter[0])).default(config.solidOptions.adapter[1]);
    } else {
      return config.solidOptions.adapter;
    }
  }

  config.adapter = await resolveAdapter(config);
  return config;
}

function launch(port) {
  let cmd = "open";
  if (process.platform == "win32") {
    cmd = "start";
  } else if (process.platform == "linux") {
    cmd = "xdg-open";
  }
  exec(`${cmd} http://localhost:${port}`);
}
