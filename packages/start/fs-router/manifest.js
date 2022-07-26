// make asset lookup
import { posix } from "path";
import { toPath } from "./path-utils.js";

/**
 * Output:
 * * To be consumed by the Links/Scripts components, using solid-app-router path syntax
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
  const pageRegex = new RegExp(`\\.(${config.solidOptions.pageExtensions.join("|")})$`);
  const baseRoutes = posix.join(config.solidOptions.appRoot, config.solidOptions.routesDir);
  let routes = Object.keys(ssrManifest)
    .filter(key => key.startsWith(baseRoutes) && key.match(pageRegex))
    .map(key => [key, ssrManifest[key]])
    .map(([key, value]) => {
      let files = [];
      let visitedFiles = new Set();

      function visitFile(file) {
        if (file.file.endsWith('css')) return;
        if (visitedFiles.has(file.file)) return;
        visitedFiles.add(file.file);
        files.push({
          type: file.file.endsWith(".css") ? "style" : "script",
          href: "/" + file.file
        });
        if (!visitedScripts.has(file.file)) {
          visitedScripts.add(file.file);
          if (
            file.src &&
            file.src.match(new RegExp(`entry-client\\.(${["ts", "tsx", "jsx", "js"].join("|")})$`))
          ) {
            entryClientScripts.push({ type: "script", href: "/" + file.file });
          }
        }
      });

      file.css?.forEach(css => {
        if (visitedFiles.has(css)) return;
        files.push({ type: "style", href: "/" + css });
        visitedFiles.add(css);

        // if (!visitedScripts.has(file.src)) {
        //   visitedScripts.add(file.src);
        //   if (
        //     file.src &&
        //     file.src.match(
        //       new RegExp(`entry-client\\.(${["ts", "tsx", "jsx", "js"].join("|")})$`)
        //     )
        //   ) {
        //     entryClientScripts.push({ type: "style", href: "/" + css });
        //   }
        // }
      });
    }

    return {
      addAsset(val) {
        let asset = Object.values(assetManifest).find(f => "/" + f.file === val);
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
      getFiles() {
        return files;
      }
    };
  }

  let routes = Object.keys(ssrManifest)
    .filter(key => key.startsWith(baseRoutes) && key.match(pageRegex))
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
        toPath(key.slice(baseRoutes.length).replace(pageRegex, ""), false),
        assets.getFiles()
      ];
    })
    .filter(Boolean);

  let entryClient = Object.keys(ssrManifest).find(key =>
    key.match(new RegExp(`entry-client\\.(${["ts", "tsx", "jsx", "js"].join("|")})$`))
  );
  const assets = collectAssets();

  if (entryClient) {
    assets.addSrc(entryClient);
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
      ["entry-client", assets.getFiles()]
    ])
  };
}
