import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import c from "picocolors";
import { build, resolveConfig } from "vite";
// import waitOn from "wait-on";
import prepareManifest from "../fs-router/manifest.js";

let DEBUG = console.log;

export default async function(path, config) {
  const resolved = await resolveConfig(config, 'build', 'production', 'production')
  config.root = resolved.root;
  (config.build || (config.build = {})).minify = resolved.build?.minify;
  if (!resolved.solidOptions.ssr) {
    await spaClient(path, config, resolved.solidOptions);
  } else if (resolved.solidOptions.islands) {
    await islandsClient(path, config, resolved.solidOptions);
  } else {
    await client(path, config, resolved.solidOptions);
  }
}


async function client(path, config, solidOptions) {
  const resolved = await resolveConfig(config, 'build', 'production', 'production')
  const inspect = join(config.root, ".solid", "inspect");
  console.log();
  console.log(c.blue("solid-start") + c.magenta(" building client..."));
  console.time(c.blue("solid-start") + c.magenta(" client built in"));
  await build({
    ...config,
    build: {
      outDir: path,
      ssrManifest: true,
      minify: process.env.START_MINIFY === "false" ? false : config.build?.minify ?? true,
      rollupOptions: {
        input: solidOptions.clientEntry,
        output: {
          manualChunks: undefined
        }
      }
    }
  });
  let assetManifest = JSON.parse(readFileSync(join(path, "manifest.json")).toString());
  let ssrManifest = JSON.parse(readFileSync(join(path, "ssr-manifest.json")).toString());

  let routeManifest = prepareManifest(ssrManifest, assetManifest, resolved);
  writeFileSync(join(path, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));

  writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));
  writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
  writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));
  console.timeEnd(c.blue("solid-start") + c.magenta(" client built in"));
}

async function spaClient(path, config, solidOptions) {}

async function islandsClient(path, config, solidOptions) {}

// export default {
//   islandsClient: async (path, config) => {
//     console.log();
//     console.log(c.blue("solid-start") + c.magenta(" finding islands..."));
//     console.time(c.blue("solid-start") + c.magenta(" found islands in"));

//     let routeManifestPath = join(config.root, ".solid", "route-manifest");
//     await vite.build({
//       build: {
//         outDir: routeManifestPath,
//         ssrManifest: true,
//         minify: process.env.START_MINIFY === "false" ? false : config.build?.minify ?? true,
//         rollupOptions: {
//           input: [
//             resolve(join(config.root, "node_modules", "solid-start", "islands", "entry-client"))
//           ],
//           output: {
//             manualChunks: undefined
//           }
//         }
//       }
//     });

//     let assetManifest = JSON.parse(
//       readFileSync(join(routeManifestPath, "manifest.json")).toString()
//     );
//     let ssrManifest = JSON.parse(
//       readFileSync(join(routeManifestPath, "ssr-manifest.json")).toString()
//     );

//     writeFileSync(
//       join(routeManifestPath, "route-manifest.json"),
//       JSON.stringify(prepareManifest(ssrManifest, assetManifest, config), null, 2)
//     );

//     let routeManifest = JSON.parse(
//       readFileSync(join(routeManifestPath, "route-manifest.json")).toString()
//     );

//     let islands = Object.keys(routeManifest).filter(a => a.endsWith("?island"));

//     console.timeEnd(c.blue("solid-start") + c.magenta(" found islands in"));
//     console.log();
//     console.log(c.blue("solid-start") + c.magenta(" building islands client..."));
//     console.time(c.blue("solid-start") + c.magenta(" built islands client in"));
//     await vite.build({
//       configFile: config.configFile,
//       root: config.root,
//       build: {
//         outDir: path,
//         ssrManifest: true,
//         minify: process.env.START_MINIFY === "false" ? false : config.build?.minify ?? true,
//         rollupOptions: {
//           input: [
//             config.solidOptions.clientEntry,
//             ...islands.map(i => resolve(join(config.root, i)))
//           ],
//           output: {
//             manualChunks: undefined
//           }
//         }
//       }
//     });

//     assetManifest = JSON.parse(readFileSync(join(path, "manifest.json")).toString());
//     ssrManifest = JSON.parse(readFileSync(join(path, "ssr-manifest.json")).toString());

//     let islandsManifest = prepareManifest(ssrManifest, assetManifest, config, islands);

//     let newManifest = {
//       ...Object.fromEntries(
//         Object.entries(routeManifest)
//           .filter(([k]) => k.startsWith("/"))
//           .map(([k, v]) => [k, v.filter(a => a.type !== "script")])
//       ),
//       ...Object.fromEntries(
//         Object.entries(islandsManifest)
//           .filter(([k]) => k.endsWith("?island"))
//           .map(([k, v]) => [
//             k,
//             {
//               script: v.script,
//               assets: [
//                 ...v.assets.filter(a => a.type === "script"),
//                 ...routeManifest[k].assets.filter(a => a.type === "style")
//               ]
//             }
//           ])
//       ),
//       "entry-client": [
//         ...islandsManifest["entry-client"].filter(a => a.type === "script"),
//         ...routeManifest["entry-client"].filter(a => a.type === "style")
//       ]
//     };

//     Object.values(newManifest).forEach(v => {
//       let assets = Array.isArray(v) ? v : v.assets;
//       assets.forEach(a => {
//         if (a.type === "style") {
//           copyFileSync(join(routeManifestPath, a.href), join(path, a.href));
//         }
//       });
//     });

//     writeFileSync(join(path, "route-manifest.json"), JSON.stringify(newManifest, null, 2));
//     writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(newManifest, null, 2));
//     writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
//     writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));
//     console.timeEnd(c.blue("solid-start") + c.magenta(" built islands client in"));
//   },
//   spaClient: async (path, config) => {
//     console.log();
//     console.log(c.blue("solid-start") + c.magenta(" building client..."));
//     console.time(c.blue("solid-start") + c.magenta(" client built in"));

//     let isDebug = process.env.DEBUG && process.env.DEBUG.includes("start");
//     mkdirSync(join(config.root, ".solid"), { recursive: true });

//     let indexHtml;
//     if (existsSync(join(config.root, "index.html"))) {
//       indexHtml = join(config.root, "index.html");
//     } else {
//       DEBUG("starting vite server for index.html");
//       console.log(c.blue("solid-start") + c.magenta(" rendering index.html..."));
//       console.time(c.blue("solid-start") + c.magenta(" index.html rendered in"));
//       let port = await (await import("get-port")).default();
//       let proc = spawn(
//         "vite",
//         [
//           "dev",
//           "--mode",
//           "production",
//           ...(config ? ["--config", config.configFile] : []),
//           ...(port ? ["--port", port] : [])
//         ],
//         {
//           stdio: isDebug ? "inherit" : "ignore",
//           shell: true,
//           env: {
//             ...process.env,
//             START_INDEX_HTML: "true",
//             NODE_OPTIONS: [
//               process.env.NODE_OPTIONS,
//               "--experimental-vm-modules",
//             ]
//               .filter(Boolean)
//               .join(" "),
//           }
//         }
//       );

//       process.on("SIGINT", function () {
//         proc.kill();
//         process.exit();
//       });

//       await waitOn({
//         resources: [`http://localhost:${port}/`],
//         verbose: isDebug
//       });

//       DEBUG("started vite server for index.html");

//       writeFileSync(
//         join(config.root, ".solid", "index.html"),
//         await (
//           await import("../dev/create-index-html.js")
//         ).createHTML(`http://localhost:${port}/`)
//       );

//       indexHtml = join(config.root, ".solid", "index.html");

//       DEBUG("spa index.html created");
//       console.timeEnd(c.blue("solid-start") + c.magenta(" index.html rendered in"));

//       proc.kill();
//     }

//     DEBUG("building client bundle");

//     process.env.START_SPA_CLIENT = "true";
//     await vite.build({
//       configFile: config.configFile,
//       root: config.root,
//       build: {
//         outDir: path,
//         minify: process.env.START_MINIFY == "false" ? false : config.build?.minify ?? true,
//         ssrManifest: true,
//         rollupOptions: {
//           input: indexHtml,
//           output: {
//             manualChunks: undefined
//           }
//         }
//       }
//     });
//     process.env.START_SPA_CLIENT = "false";

//     if (indexHtml === join(config.root, ".solid", "index.html")) {
//       renameSync(join(path, ".solid", "index.html"), join(path, "index.html"));
//     }

//     DEBUG("built client bundle");

//     let assetManifest = JSON.parse(readFileSync(join(path, "manifest.json")).toString());
//     let ssrManifest = JSON.parse(readFileSync(join(path, "ssr-manifest.json")).toString());
//     let routeManifest = prepareManifest(ssrManifest, assetManifest, config);

//     writeFileSync(join(path, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));

//     writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));
//     writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
//     writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));

//     DEBUG("wrote route manifest");
//     console.timeEnd(c.blue("solid-start") + c.magenta(" client built in"));
//   }
// }