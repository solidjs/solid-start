#!/usr/bin/env node
"use strict";

const { exec, spawn } = require("child_process");
const sade = require("sade");
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
const pkg = require(join(__dirname, "package.json"));
const DEBUG = require("debug")("start");
globalThis.DEBUG = DEBUG;

const prog = sade("solid-start").version("alpha");
console.log("solid-start", pkg.version);

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
  .option("-i,--inspect", "Node inspector", false)
  .option("-p, --port", "Port to start server on", 3000)
  .action(async ({ config: configFile, open, port, root, host, inspect }) => {
    root = root || process.cwd();
    if (!existsSync(join(root, "package.json"))) {
      console.log('No package.json found in "%s"', root);
      console.log('Creating package.json in "%s"', root);
      writeFileSync(
        join(root, "package.json"),
        JSON.stringify(
          {
            name: "my-app",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: {
              dev: "solid-start dev",
              build: "solid-start build",
              preview: "solid-start start"
            },
            devDependencies: {
              typescript: pkg.devDependencies["typescript"],
              vite: pkg.devDependencies["vite"]
            },
            dependencies: {
              "@solidjs/meta": pkg.devDependencies["@solidjs/meta"],
              "@solidjs/router": pkg.devDependencies["@solidjs/router"],
              "solid-start": pkg.devDependencies[pkg.version],
              "solid-js": pkg.devDependencies["solid-js"]
            }
          },
          null,
          2
        )
      );

      console.log("Installing dependencies...");
      await new Promise((resolve, reject) => {
        exec("npm install", { cwd: root }, (err, stdout, stderr) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }).stdout.pipe(process.stdout);
      });
    }

    if (!existsSync(join(root, "src"))) {
      console.log('No src directory found in "%s"', root);
      console.log('Creating src directory in "%s"', root);
      mkdirSync(join(root, "src", "routes"), { recursive: true });
      writeFileSync(
        join(root, "src", "routes", "index.tsx"),
        `export default function Page() { return <div>Hello World</div> }`
      );
    }

    const config = await resolveConfig({ configFile, root, mode: "development", command: "serve" });
    console.log(config.adapter.name);

    DEBUG(
      [
        "running",
        "node",
        "--experimental-vm-modules",
        inspect ? "--inspect" : undefined,
        "node_modules/vite/bin/vite.js",
        "dev",
        ...(root ? [root] : []),
        ...(config ? ["--config", config.configFile] : []),
        ...(port ? ["--port", port] : []),
        ...(host ? ["--host"] : [])
      ]
        .filter(Boolean)
        .join(" ")
    );
    spawn(
      "node",
      [
        "--experimental-vm-modules",
        inspect ? "--inspect" : undefined,
        "node_modules/vite/bin/vite.js",
        "dev",
        ...(config ? ["--config", config.configFile] : []),
        ...(port ? ["--port", port] : []),
        ...(host ? ["--host"] : [])
      ].filter(Boolean),
      {
        shell: true,
        stdio: "inherit"
      }
    );

    if (open) setTimeout(() => launch(port), 1000);
    // (await import("./runtime/devServer.js")).start({ config, port, root });
  });

prog
  .command("build")
  .option("-r --root", "Root directory")
  .option("-c, --config", "Vite config file")
  .describe("Create production build")
  .action(async ({ root, config: configFile }) => {
    const config = await resolveConfig({ configFile, root, mode: "production", command: "build" });

    const { default: prepareManifest } = await import("./fs-router/manifest.js");

    const inspect = join(config.root, ".solid", "inspect");

    config.adapter.build(config, {
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

        const vite = require("vite");

        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            outDir: path,
            ssrManifest: true,
            minify: process.env.START_MINIFY === "false" ? false : "terser",
            rollupOptions: {
              input: [
                config.solidOptions.clientEntry,
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
        writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(newManifest, null, 2));
        writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
        writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));
      },
      server: async path => {
        await vite.build({
          configFile: config.configFile,
          root: config.root,
          build: {
            ssr: true,
            outDir: path,
            rollupOptions: {
              input: config.solidOptions.serverEntry,
              output: {
                inlineDynamicImports: true,
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
            "node",
            [
              "--experimental-vm-modules",
              "node_modules/vite/bin/vite.js",
              "dev",
              "--mode",
              "production",
              ...(config ? ["--config", config.configFile] : []),
              ...(port ? ["--port", port] : [])
            ],
            {
              stdio: isDebug ? "inherit" : "ignore",
              shell: true,
              env: {
                ...process.env,
                START_INDEX_HTML: "true"
              }
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
            minify: process.env.START_MINIFY == "false" ? false : "terser",
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
    const config = await resolveConfig({ mode: "production", configFile, root, command: "build" });

    let url = await config.adapter.start(config, { port });
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
    const vite = require("vite");

    const config = await vite.resolveConfig({}, "serve");
    console.log(await fn(config));
  });

prog.parse(process.argv);

/**
 *
 * @param {*} param0
 * @returns {Promise<import('node_modules/vite').ResolvedConfig & { solidOptions: import('./types').StartOptions, adapter: import('./types').Adapter }>}
 */
async function resolveConfig({ configFile, root, mode, command }) {
  const vite = require("vite");
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

  let config = await vite.resolveConfig({ mode, configFile, root }, command);

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
