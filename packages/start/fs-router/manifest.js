// make asset lookup
import { toPath } from "./path-utils.js";

/**
 * Output:
 * * To be consumed by the Links/Scripts components, using solid-router path syntax
 * {
 *  "entry-client": [{ type: script, href: "/dist/public/entry-client.js" }],
 *  "/": [
 *      { type: script, href: "/dist/public/index.js" }
 *      { type: script, href: "/dist/public/index.css" },
 *      { type: script, href: "/dist/public/entry-client.js" }
 *   ],
 *   "/about": [
 *      { type: script, href: "/dist/public/about.js" }
 *      { type: script, href: "/dist/public/about.css" },
 *      { type: script, href: "/dist/public/entry-client.js" }
 *    ],
 * }
 *
 * @param {*} ssrManifest
 * @param {*} assetManifest
 * @returns
 */
export default function prepareManifest(ssrManifest, assetManifest, config, islands = []) {
  const basePath =
    typeof config.base === "string"
      ? (config.base || "./").endsWith("/")
        ? config.base
        : config.base + "/"
      : "/";

  let manifest = {};

  let src;
  function collect(_src) {
    src = _src;
    let assets = collectAssets();
    assets.addSrc(_src);

    let files = assets.getFiles();
    src = null;
    return files;
  }

  function collectAsset(_src) {
    src = _src;
    let assets = collectAssets();
    assets.addChunk(_src);

    let files = assets.getFiles();
    src = null;
    return files;
  }

  function collectAssets() {
    let files = [];
    let visitedFiles = new Set();

    function visitFile(file) {
      if (visitedFiles.has(file.file)) return;
      visitedFiles.add(file.file);
      files.push({
        type: file.file.endsWith(".css") ? "style" : file.file.endsWith(".js") ? "script" : "asset",
        href: basePath + file.file
      });

      file.imports?.forEach(imp => {
        if (imp === src) return;
        if (
          (imp.includes("?island") || imp.includes("?client") || imp.includes("_island")) &&
          !src
        ) {
          files.push({ type: "island", href: imp });
          let f = imp.includes("?island") ? collect(imp) : collectAsset(imp);

          manifest[imp] = {
            script: f[0],
            assets: f
          };
        } else {
          visitFile(assetManifest[imp]);
        }
      });

      file.dynamicImports?.forEach(imp => {
        if (imp === src) return;
        if (
          (imp.includes("?island") || imp.includes("?client") || imp.includes("_island")) &&
          !src
        ) {
          files.push({ type: "island", href: imp });
          let f = collect(imp);
          manifest[imp] = {
            script: f[0],
            assets: f
          };
        }
      });

      file.css?.forEach(css => {
        if (visitedFiles.has(css)) return;
        files.push({ type: "style", href: basePath + css });
        visitedFiles.add(css);

        // if (!visitedScripts.has(file.src)) {
        //   visitedScripts.add(file.src);
        //   if (
        //     file.src &&
        //     file.src.match(
        //       new RegExp(`entry-client\\.(${["ts", "tsx", "jsx", "js"].join("|")})$`)
        //     )
        //   ) {
        //     clientEntryScripts.push({ type: "style", href: basePath + css });
        //   }
        // }
      });
    }

    return {
      addAsset(val) {
        let asset = Object.values(assetManifest).find(f => basePath + f.file === val);
        if (!asset) {
          return;
        }
        visitFile(asset);
      },
      addSrc(val) {
        let asset = Object.values(assetManifest).find(f => f.src === val);
        if (!asset) {
          return;
        }
        visitFile(asset);
      },
      addChunk(val) {
        let asset = assetManifest[val];
        if (!asset) {
          return;
        }
        visitFile(asset);
      },
      getFiles() {
        return files;
      }
    };
  }

  let routes = Object.keys(ssrManifest)
    .filter(
      key =>
        key.startsWith(config.solidOptions.router.baseDir) &&
        key.match(config.solidOptions.router.pageRegex)
    )
    .map(key => [key, ssrManifest[key]])
    .map(([key, value]) => {
      const assets = collectAssets();
      value.forEach(val => {
        assets.addAsset(val);
      });

      if (!value.length) {
        assets.addSrc(key);
      }

      if (key.match(new RegExp(`entry-client\\.(${["ts", "tsx", "jsx", "js"].join("|")})$`))) {
        return null;
      }

      return [
        toPath(
          config.solidOptions.router.getRouteId(
            key.replace(config.solidOptions.router.pageRegex, "")
          ),
          false
        ),
        assets.getFiles()
      ];
    })
    .filter(Boolean);

  let clientEntry = Object.keys(ssrManifest).find(key =>
    key.match(new RegExp(`entry-client\\.(${["ts", "tsx", "jsx", "js"].join("|")})$`))
  );

  const clientEntryAssets = collectAssets();
  if (clientEntry) {
    clientEntryAssets.addSrc(clientEntry);
  }

  let indexHtml = Object.keys(assetManifest).find(key => key.match(new RegExp(`index.html$`)));
  const indexHtmlAssets = collectAssets();
  if (indexHtml) {
    indexHtmlAssets.addSrc(indexHtml);
  }

  return {
    ...manifest,
    ...Object.fromEntries([
      ...routes,
      ...islands.map(i => {
        let asset = collectAssets();

        asset.addSrc(i);

        return [
          i,
          {
            script: asset.getFiles()[0],
            assets: asset.getFiles()
          }
        ];
      }),
      ["entry-client", clientEntryAssets.getFiles()],
      ["index.html", indexHtmlAssets.getFiles()]
    ])
  };
}
