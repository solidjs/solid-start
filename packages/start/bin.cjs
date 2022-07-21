#!/usr/bin/env node
"use strict";

const { exec, spawn } = require("child_process");
const sade = require("sade");
const vite = require("vite");
const { resolve, join } = require("path");
const { readFileSync, writeFileSync } = require("fs");

const prog = sade("solid-start").version("alpha");

prog
  .command("dev")
  .describe("Start a development server")
  .option("-o, --open", "Open a browser tab", false)
  .option("-r --root", "Root directory")
  .option("-c, --config", "Vite config file")
  .option("-p, --port", "Port to start server on", 3000)
  .action(async ({ config, open, port, root, host }) => {
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
  .describe("Create production build")
  .action(async () => {
    const config = await vite.resolveConfig({ mode: "production" }, "build");
    let adapter = config.solidOptions.adapter;
    if (typeof adapter === "string") {
      adapter = (await import(adapter)).default();
    }
    const { default: prepareManifest } = await import("./fs-router/manifest.js");

    adapter.build(config, {
      client: async path => {
        await vite.build({
          build: {
            outDir: path,
            ssrManifest: true,
            minify: "terser",
            rollupOptions: {
              input: resolve(join(config.root, config.solidOptions.appRoot, `entry-client`)),
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
      spaClient: async path => {
        await vite.build({
          build: {
            outDir: path,
            minify: "terser",
            ssrManifest: true,
            rollupOptions: {
              input: resolve(join(config.root, "index.html")),
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
      }
    });
  });

prog
  .command("start")
  .describe("Run production build")
  .action(async () => {
    const config = await vite.resolveConfig({ mode: "production" }, "build");
    let adapter = config.solidOptions.adapter;
    if (typeof adapter === "string") {
      adapter = (await import(adapter)).default();
    }
    let url = adapter.start(config);
    const { Router } = await import("./fs-router/router.js");
    const { default: printUrls } = await import("./dev/print-routes.js");
    const router = new Router({
      baseDir: join(config.solidOptions.appRoot, config.solidOptions.routesDir)
    });
    await router.init();
    printUrls(router, url);
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
