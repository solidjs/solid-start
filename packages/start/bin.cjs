#!/usr/bin/env node
"use strict";

const { exec } = require("child_process");
const sade = require("sade");
const vite = require("vite");

const prog = sade("solid-start").version("alpha");

prog
  .command("dev")
  .describe("Start a development server")
  .option("-o, --open", "Open a browser tab", false)
  .option("-r --root", "Root directory")
  .option("-c, --config", "Vite config file")
  .option("-p, --port", "Port to start server on", 3000)
  .action(async ({ config, open, port, root }) => {
    if (open) setTimeout(() => launch(port), 1000);
    (await import("./runtime/devServer.js")).start({ config, port, root });
  });

prog
  .command("build")
  .describe("Create production build")
  .action(async () => {
    const config = await vite.resolveConfig({}, "build");
    let adapter = config.solidOptions.adapter;
    if (typeof adapter === "string") {
      adapter = (await import(adapter)).default();
    }
    adapter.build(config);
  });

prog
  .command("start")
  .describe("Run production build")
  .action(async () => {
    const config = await vite.resolveConfig({}, "build");
    let adapter = config.solidOptions.adapter;
    if (typeof adapter === "string") {
      adapter = (await import(adapter)).default();
    }
    adapter.start(config);
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
