#!/usr/bin/env node
"use strict";

const path = require("path");
const { spawn, exec } = require("child_process");
const sade = require("sade");

const prog = sade("solid-start").version("__VERSION__");

prog
  .command("dev")
  .describe("Start a development server")
  .option("-o, --open", "Open a browser tab", false)
  .action(({ open }) => {
    const proc = spawn("node", [path.join(__dirname, "runtime", "server.cjs")]);
    proc.stdout.pipe(process.stdout);
    if (open) launch(3000);
  });

function launch(port) {
  let cmd = "open";
  if (process.platform == "win32") {
    cmd = "start";
  } else if (process.platform == "linux") {
    cmd = "xdg-open";
  }
  exec(`${cmd} http://localhost:${port}`);
}
