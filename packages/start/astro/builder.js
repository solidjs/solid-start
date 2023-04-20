import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "path";
import c from "picocolors";
import renderStatic from "solid-ssr/static";
import { build, resolveConfig } from "vite";
import prepareManifest from "../fs-router/manifest.js";

export default async function(path, serverPath, config) {
  const resolved = await resolveConfig(config, 'build', 'production', 'production');
  config.root = resolved.root;
  (config.build || (config.build = {})).minify = resolved.build?.minify;
  const staticRendering = !resolved.solidOptions.ssr
    || resolved.solidOptions.prerenderStatic || resolved.solidOptions.prerenderRoutes;

  if (staticRendering) {
    const serverManifest = JSON.parse(readFileSync(join(serverPath, "manifest.json")).toString());
    const key = Object.keys(serverManifest).find(key => key.startsWith("_all."));
    process.env.START_ENTRY_STATIC = join(serverPath, serverManifest[key].file);
  }

  if (!resolved.solidOptions.ssr) {
    await spaClient(path, serverPath, config, resolved);
  } else if (resolved.solidOptions.islands) {
    await islandsClient(path, serverPath, config, resolved);
  } else {
    await client(path, serverPath, config, resolved);
  }
  if (resolved.solidOptions.ssr) await preRenderRoutes(path, resolved);
}

function writeRouteManifest(routeManifest, serverPath) {
  const serverManifest = JSON.parse(readFileSync(join(serverPath, "manifest.json")).toString());
  const key = Object.keys(serverManifest).find(key => key.startsWith("_all."));
  const serverEntry = join(serverPath, serverManifest[key].file);
  let code = readFileSync(serverEntry).toString();
  code = code.replace("\"$ROUTE_MANIFEST\"", JSON.stringify(routeManifest, null, 2));
  writeFileSync(serverEntry, code);
}


async function client(path, serverPath, config, resolved) {
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
  writeRouteManifest(prepareManifest(ssrManifest, assetManifest, resolved), serverPath);

  console.timeEnd(c.blue("solid-start") + c.magenta(" client built in"));
}

async function spaClient(path, serverPath, config, resolved) {
  console.log();
  console.log(c.blue("solid-start") + c.magenta(" building client..."));
  console.time(c.blue("solid-start") + c.magenta(" client built in"));

  let keepIndexHtml = false;
  if (existsSync(join(config.root, "index.html"))) {
    keepIndexHtml = true;
  } else {
    console.log(c.blue("solid-start") + c.magenta(" rendering index.html..."));
    console.time(c.blue("solid-start") + c.magenta(" index.html rendered in"));

    process.env.START_INDEX_HTML = "true";
    process.env.START_ENTRY_CLIENT = resolved.solidOptions.clientEntry;
    await renderStatic({
      entry: fileURLToPath(new URL('./handler-static.js', import.meta.url).toString()),
      output: "index.html",
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
        input: "index.html",
        output: {
          manualChunks: undefined
        }
      }
    }
  });
  process.env.START_SPA_CLIENT = "false";

  if (!keepIndexHtml) unlinkSync("index.html");


  let assetManifest = JSON.parse(readFileSync(join(path, "manifest.json")).toString());
  let ssrManifest = JSON.parse(readFileSync(join(path, "ssr-manifest.json")).toString());
  writeRouteManifest(prepareManifest(ssrManifest, assetManifest, resolved), serverPath);

  console.timeEnd(c.blue("solid-start") + c.magenta(" client built in"));
}

async function islandsClient(path, serverPath, config, resolved) {
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
  let routeManifest = prepareManifest(ssrManifest, assetManifest, resolved);
  writeFileSync(join(routeManifestPath, "route-manifest.js"), `export default ${JSON.stringify(routeManifest, null, 2)}`);

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
  writeRouteManifest(newManifest, serverPath);
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
  await renderStatic(
    routes.map(url => ({
      entry: fileURLToPath(new URL('./handler-static.js', import.meta.url).toString()),
      output: join(
        path,
        url.endsWith("/") ? `${url.slice(1)}index.html` : `${url.slice(1)}.html`
      ),
      url
    }))
  );
}