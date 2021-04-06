#!/usr/bin/env node
"use strict";

const path = require("path");
const { exec } = require("child_process");
const sade = require("sade");
const vite = require("vite");

const prog = sade("solid-start").version("alpha");

prog
  .command("dev")
  .describe("Start a development server")
  .option("-o, --open", "Open a browser tab", false)
  .option("-p, --port", "Port to start server on", 3000)
  .action(async ({ open, port }) => {
    if (open) setTimeout(() => launch(port), 1000);
    (await import("./runtime/devServer.js")).start({ port });
  });

prog
  .command("build")
  .describe("Create production build")
  .action(async () => {
    const config = await vite.resolveConfig({}, "build");
    (await import(adapter)).default(config)
  });

prog
  .command("start")
  .describe("Run production build")
  .option("-o, --open", "Open a browser tab", false)
  .action(async ({ open }) => {
    if (open) setTimeout(() => launch(process.env.PORT || 3000), 1000);
    await import(`${process.cwd()}/dist/index.js`);
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
