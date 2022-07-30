#!/usr/bin/env node
"use strict";

const { exec, spawn } = require("child_process");
const sade = require("sade");
const vite = require("vite");
const { resolve, join } = require("path");
const {
  readFileSync,
  writeFileSync,
  existsSync,
  renameSync,
  mkdirSync,
  copyFileSync
} = require("fs");
const waitOn = require("wait-on");

const DEBUG = require("debug")("start");
globalThis.DEBUG = DEBUG;

const prog = sade("solid-start").version("alpha");

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
  .command("dev")
  .describe("Start a development server")
  .option("-o, --open", "Open a browser tab", false)
  .option("-r --root", "Root directory")
  .option("-c, --config", "Vite config file")
  .option("-p, --port", "Port to start server on", 3000)
  .action(async ({ config, open, port, root, host }) => {
    root = root || process.cwd();
    if (!config) {
      if (!config) {
        config = findAny(root, "start.config");
      }
      if (!config) {
        config = findAny(root, "vite.config");
      }

      if (!config) {
        config = join(root, "node_modules", "solid-start", "vite", "config.js");
      }
      DEBUG('config file: "%s"', config);
    }
    if (open) setTimeout(() => launch(port), 1000);
    spawn(
      "vite",
      [
        "dev",
        ...(config ? ["--config", config] : []),
        ...(port ? ["--port", port] : []),
        ...(host ? ["--host"] : [])
      ],
      {
        shell: true,
        stdio: "inherit"
      }
    );
    // (await import("./runtime/devServer.js")).start({ config, port, root });
  });

prog
  .command("build")
  .option("-r --root", "Root directory")
  .option("-c, --config", "Vite config file")
  .describe("Create production build")
  .action(async ({ root, config: configFile }) => {
    root = root || process.cwd();
    if (!configFile) {
      if (!configFile) {
        configFile = findAny(root, "start.config");
      }
      if (!configFile) {
        configFile = findAny(root, "vite.config");
      }

      if (!configFile) {
        configFile = join(root, "node_modules", "solid-start", "vite", "config.js");
      }
      DEBUG('config file: "%s"', configFile);
    }

    const config = await vite.resolveConfig({ mode: "production", configFile, root }, "build");
    let adapter = config.solidOptions.adapter;
    if (typeof adapter === "string") {
      adapter = (await import(adapter)).default();
    }
    const { default: prepareManifest } = await import("./fs-router/manifest.js");

    adapter.build(config, {
      islandsClient: async path => {
        let routeManifestPath = join(config.root, ".solid", "route-manifest");
        await vite.build({
          build: {
            outDir: routeManifestPath,
            ssrManifest: true,
            minify: process.env.START_MINIFY === "false" ? false : "terser",
            rollupOptions: {
              input: [
                resolve(join(config.root, "node_modules", "solid-start", "islands", "entry-client"))
              ],
              output: {
                manualChunks: undefined
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

        let islands = Object.keys(routeManifest).filter(a => a.endsWith("?island"));

        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            outDir: path,
            ssrManifest: true,
            minify: process.env.START_MINIFY === "false" ? false : "terser",
            rollupOptions: {
              input: [
                resolve(join(config.root, config.solidOptions.appRoot, `entry-client`)),
                ...islands.map(i => resolve(join(config.root, i)))
              ],
              output: {
                manualChunks: undefined
              }
            }
          }
        });

        assetManifest = JSON.parse(readFileSync(join(path, "manifest.json")).toString());
        ssrManifest = JSON.parse(readFileSync(join(path, "ssr-manifest.json")).toString());

        let islandsManifest = prepareManifest(ssrManifest, assetManifest, config, islands);

        let newManifest = {
          ...Object.fromEntries(
            Object.entries(routeManifest)
              .filter(([k]) => k.startsWith("/"))
              .map(([k, v]) => [k, v.filter(a => a.type !== "script")])
          ),
          ...Object.fromEntries(
            Object.entries(islandsManifest)
              .filter(([k]) => k.endsWith("?island"))
              .map(([k, v]) => [
                k,
                {
                  script: v.script,
                  assets: [
                    ...v.assets.filter(a => a.type === "script"),
                    ...routeManifest[k].assets.filter(a => a.type === "style")
                  ]
                }
              ])
          ),
          "entry-client": [
            ...islandsManifest["entry-client"].filter(a => a.type === "script"),
            ...routeManifest["entry-client"].filter(a => a.type === "style")
          ]
        };

        Object.values(newManifest).forEach(v => {
          let assets = Array.isArray(v) ? v : v.assets;
          assets.forEach(a => {
            if (a.type === "style") {
              copyFileSync(join(routeManifestPath, a.href), join(path, a.href));
            }
          });
        });

        writeFileSync(join(path, "route-manifest.json"), JSON.stringify(newManifest, null, 2));
      },
      server: async path => {
        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            ssr: true,
            outDir: path,
            rollupOptions: {
              input: config.solidOptions.entryServer,
              output: {
                format: "esm"
              }
            }
          }
        });
      },
      client: async path => {
        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            outDir: path,
            ssrManifest: true,
            minify: process.env.START_MINIFY === "false" ? false : "terser",
            rollupOptions: {
              input: config.solidOptions.entryClient,
              output: {
                manualChunks: undefined
              }
            }
          }
        });

        let assetManifest = JSON.parse(readFileSync(join(path, "manifest.json")).toString());
        let ssrManifest = JSON.parse(readFileSync(join(path, "ssr-manifest.json")).toString());

        writeFileSync(
          join(path, "route-manifest.json"),
          JSON.stringify(prepareManifest(ssrManifest, assetManifest, config), null, 2)
        );
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
        DEBUG("spa build start");
        let isDebug = process.env.DEBUG && process.env.DEBUG.includes("start");
        mkdirSync(join(config.root, ".solid"), { recursive: true });

        let indexHtml;
        if (existsSync(join(config.root, "index.html"))) {
          indexHtml = join(config.root, "index.html");
        } else {
          DEBUG("starting vite server for index.html");
          let port = await (await import("get-port")).default();
          let proc = spawn(
            "vite",
            ["dev", "--mode", "production", "--port", port, "--config", config.configFile],
            {
              stdio: isDebug ? "inherit" : "ignore",
              shell: true
            }
          );
          process.on("SIGINT", function () {
            proc.kill();
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

          proc.kill();
        }

        DEBUG("building client bundle");

        process.env.START_SPA_CLIENT = "true";
        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            outDir: path,
            minify: false,
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

        writeFileSync(
          join(path, "route-manifest.json"),
          JSON.stringify(prepareManifest(ssrManifest, assetManifest, config), null, 2)
        );

        DEBUG("wrote route manifest");
      }
    });
  });

prog
  .command("start")
  .option("-r --root", "Root directory")
  .option("-c, --config", "Vite config file")
  .describe("Start production build")
  .action(async ({ root, config: configFile }) => {
    root = root || process.cwd();
    if (!configFile) {
      if (!configFile) {
        configFile = findAny(root, "start.config");
      }
      if (!configFile) {
        configFile = findAny(root, "vite.config");
      }

      if (!configFile) {
        configFile = join(root, "node_modules", "solid-start", "vite", "config.js");
      }
      DEBUG('config file: "%s"', configFile);
    }

    const config = await vite.resolveConfig({ mode: "production", configFile, root }, "build");
    let adapter = config.solidOptions.adapter;
    if (typeof adapter === "string") {
      adapter = (await import(adapter)).default();
    }
    let url = await adapter.start(config);
    if (url) {
      const { Router } = await import("./fs-router/router.js");
      const { default: printUrls } = await import("./dev/print-routes.js");
      const router = new Router({
        baseDir: join(config.solidOptions.appRoot, config.solidOptions.routesDir)
      });
      await router.init();
      printUrls(router, url);
    }
  });

prog
  .command("use <feature>")
  .describe("Use a solid-start feature")
  .action(async feature => {
    const { default: fn } = await import(`./addons/${feature}.js`);

    const config = await vite.resolveConfig({}, "serve");
    console.log(await fn(config));
  });

prog.parse(process.argv);

function launch(port) {
  let cmd = "open";
  if (process.platform == "win32") {
    cmd = "start";
  } else if (process.platform == "linux") {
    cmd = "xdg-open";
  }
  exec(`${cmd} http://localhost:${port}`);
}
