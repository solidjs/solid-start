#!/usr/bin/env node
"use strict";

const sade = require("sade");
const path = require("path");

const prog = sade("solid-start").version("beta");

prog
  .command("routes").describe("Show all routes in your app")
  .action(async ({config: configFile, open, port, root, host, inspect}) => {
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