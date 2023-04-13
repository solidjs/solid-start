import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "path";
import c from "picocolors";
import renderStatic from "solid-ssr/static";
import { build, resolveConfig } from "vite";
import prepareManifest from "../fs-router/manifest.js";

export default async function(path, config) {
  const resolved = await resolveConfig(config, 'build', 'production', 'production')
  config.root = resolved.root;
  (config.build || (config.build = {})).minify = resolved.build?.minify;
  const staticRendering = !resolved.solidOptions.ssr
    || resolved.solidOptions.prerenderStatic || resolved.solidOptions.prerenderRoutes;

  if (staticRendering) {
    const serverManifest = JSON.parse(readFileSync(join(path, "../server", "manifest.json")).toString());
    const key = Object.keys(serverManifest).find(key => key.startsWith("_all."));
    process.env.START_ENTRY_STATIC = join(path, "../server", serverManifest[key].file);
    console.log(process.env.START_ENTRY_STATIC);
  }

  if (!resolved.solidOptions.ssr) {
    await spaClient(path, config, resolved);
  } else if (resolved.solidOptions.islands) {
    await islandsClient(path, config, resolved);
  } else {
    await client(path, config, resolved);
  }
  if (resolved.solidOptions.ssr) await preRenderRoutes(path, resolved);
}


async function client(path, config, resolved) {
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
        input: resolved.solidOptions.clientEntry,
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

  // writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));
  // writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
  // writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));
  console.timeEnd(c.blue("solid-start") + c.magenta(" client built in"));
}

async function spaClient(path, config, resolved) {
  console.log();
  console.log(c.blue("solid-start") + c.magenta(" building client..."));
  console.time(c.blue("solid-start") + c.magenta(" client built in"));

  let indexHtml;
  if (existsSync(join(config.root, "index.html"))) {
    indexHtml = join(config.root, "index.html");
  } else {
    console.log(c.blue("solid-start") + c.magenta(" rendering index.html..."));
    console.time(c.blue("solid-start") + c.magenta(" index.html rendered in"));

    copyFileSync(fileURLToPath(new URL('./handler-static.js', import.meta.url).toString()), join(config.root, "dist", "server", "handler.js"));

    process.env.START_INDEX_HTML = "true";
    process.env.START_ENTRY_CLIENT = resolved.solidOptions.clientEntry;
    indexHtml = join(config.root, "dist", "server", `index.html`);
    await renderStatic({
      entry: join(config.root, "dist", "server", "handler.js"),
      output: indexHtml,
      url: "/"
    });
    process.env.START_INDEX_HTML = "false";
    console.log("index.html rendered");
  }

  process.env.START_SPA_CLIENT = "true";
  await build({
    ...config,
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

  // weird vite output behavior
  renameSync(join(path, indexHtml), join(path, "index.html"));

  let assetManifest = JSON.parse(readFileSync(join(path, "manifest.json")).toString());
  let ssrManifest = JSON.parse(readFileSync(join(path, "ssr-manifest.json")).toString());
  let routeManifest = prepareManifest(ssrManifest, assetManifest, resolved);

  writeFileSync(join(path, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));

  // writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(routeManifest, null, 2));
  // writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
  // writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));

  console.timeEnd(c.blue("solid-start") + c.magenta(" client built in"));
}

async function islandsClient(path, config, resolved) {
  const inspect = join(config.root, ".solid", "inspect");
  console.log();
  console.log(c.blue("solid-start") + c.magenta(" finding islands..."));
  console.time(c.blue("solid-start") + c.magenta(" found islands in"));

  let routeManifestPath = join(config.root, ".solid", "route-manifest");
  await build({
    ...config,
    build: {
      outDir: routeManifestPath,
      ssrManifest: true,
      minify: process.env.START_MINIFY === "false" ? false : config.build?.minify ?? true,
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
    JSON.stringify(prepareManifest(ssrManifest, assetManifest, resolved), null, 2)
  );

  let routeManifest = JSON.parse(
    readFileSync(join(routeManifestPath, "route-manifest.json")).toString()
  );

  let islands = Object.keys(routeManifest).filter(a => a.endsWith("?island"));

  console.timeEnd(c.blue("solid-start") + c.magenta(" found islands in"));
  console.log();
  console.log(c.blue("solid-start") + c.magenta(" building islands client..."));
  console.time(c.blue("solid-start") + c.magenta(" built islands client in"));
  await build({
    ...config,
    build: {
      outDir: path,
      ssrManifest: true,
      minify: process.env.START_MINIFY === "false" ? false : config.build?.minify ?? true,
      rollupOptions: {
        input: [
          resolved.solidOptions.clientEntry,
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

  let islandsManifest = prepareManifest(ssrManifest, assetManifest, resolved, islands);

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
  // writeFileSync(join(inspect, "route-manifest.json"), JSON.stringify(newManifest, null, 2));
  // writeFileSync(join(inspect, "manifest.json"), JSON.stringify(assetManifest, null, 2));
  // writeFileSync(join(inspect, "ssr-manifest.json"), JSON.stringify(ssrManifest, null, 2));
  console.timeEnd(c.blue("solid-start") + c.magenta(" built islands client in"));
}

async function preRenderRoutes(path, config) {
  let routes = [];
  if (config.solidOptions.prerenderStatic) {
    await config.solidOptions.router.init();
    routes = [
      ...config.solidOptions.router
        .getFlattenedPageRoutes()
        .map(a => a.path)
        .filter(a => (a.includes(":") || a.includes("/")) && !a.includes("*")),
      "/404"
    ]
  }
  routes = [...routes, ...(config.solidOptions.prerenderRoutes || [])];
  if (!routes.length) return;
  copyFileSync(fileURLToPath(new URL('./handler-static.js', import.meta.url).toString()), join(config.root, "dist", "server", "handler.js"));
  await renderStatic(
    routes.map(url => ({
      entry: join(config.root, "dist", "server", "handler.js"),
      output: join(
        path,
        url.endsWith("/") ? `${url.slice(1)}index.html` : `${url.slice(1)}.html`
      ),
      url
    }))
  );
}