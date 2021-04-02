#!/usr/bin/env node
"use strict";

const path = require("path");
const exec = require("child_process").exec;
const script = process.argv[2];

switch (script) {
  case "dev":
    exec("node " + path.join(__dirname, "runtime", "server.cjs"), (e, stdout, stderr) => {
      if (e instanceof Error) {
        console.error(e);
        throw e;
      }
      console.log("stdout ", stdout);
      console.log("stderr ", stderr);
    });
    break;
  case "build":
    break;
  case "start":
    break;
}
