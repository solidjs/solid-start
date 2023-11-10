// make asset lookup
import { toPath } from "./path-utils.js";

/**
 * @typedef {{src?: string;file: string;imports: string[];dynamicImports?: string[];css?: string[];}} AssetManifestEntry
 */

/**
 * @typedef {{type: string; href: string;}} AssetRef
 */
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
 * @param {{ [key: string]: string[] }} ssrManifest
 * @param {{ [key: string]: AssetManifestEntry}} assetManifest
 * @param {import('../vite/plugin').ViteConfig} config
 * @param {[]} islands
 * @returns
 */
export default function prepareManifest(ssrManifest, assetManifest, config, islands = []) {
  const basePath =
    typeof config.base === "string"
      ? (config.base || "./").endsWith("/")
        ? config.base
        : config.base + "/"
      : "/";

  /**
   * @type {{ [key: string]: { script: AssetRef, assets: AssetRef[], type: string } }}
   */
  let manifest = {};

  /** @type {string | null} */
  let src;

  /**
   *
   * @param {string} _src
   * @returns
   */
  function collect(_src) {
    src = _src;
    let assets = collectAssets();
    assets.addSrc(_src);

    let files = assets.getFiles();
    src = null;
    return files;
  }

  /**
   *
   * @param {string} _src
   * @returns
   */
  function collectAsset(_src) {
    src = _src;
    let assets = collectAssets();
    assets.addChunk(_src);

    let files = assets.getFiles();
    src = null;
    return files;
  }

  /**
   *
   * @returns
   */
  function collectAssets() {
    /** @type {AssetRef[]} */
    let files = [];
    let visitedFiles = new Set();

    /** @param {AssetManifestEntry} file */
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
            type: "island",
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
            type: "island",
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
      /**
       *
       * @param {string} val
       * @returns
       */
      addAsset(val) {
        let asset = Object.values(assetManifest).find(f => basePath + f.file === val);
        if (!asset) {
          return;
        }
        visitFile(asset);
      },
      /**
       *
       * @param {string} val
       * @returns
       */
      addSrc(val) {
        let asset = Object.values(assetManifest).find(f => f.src === val);
        if (!asset) {
          return;
        }
        visitFile(asset);
      },
      /**
       *
       * @param {string} val
       * @returns
       */
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
        key.match(config.solidOptions.router.include)
    )
    .map(key => {
      let value = ssrManifest[key];
      const assets = collectAssets();
      value.forEach(val => {
        assets.addAsset(val);
      });

      if (!value.length) {
        assets.addSrc(key);
      }

      /** @type {[string, AssetRef[]]} */
      let routeEntry = [
        toPath(
          config.solidOptions.router.getRouteId(
            key.replace(config.solidOptions.router.include, "")
          ),
          false
        ),
        assets.getFiles()
      ];
      return routeEntry;
    });

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

  let entries = Object.fromEntries([
    ...routes.filter(Boolean).map(([key, val]) => [
      key,
      {
        type: "route",
        script: val[0],
        assets: val
      }
    ]),
    ...islands.map(i => {
      let asset = collectAssets();

      asset.addSrc(i);

      /** @type {[string, { script: AssetRef; assets: AssetRef[] }]} */
      return [
        i,
        {
          type: "island",
          script: asset.getFiles()[0],
          assets: asset.getFiles()
        }
      ];
    }),
    [
      "entry-client",
      (() => {
        let assets = clientEntryAssets.getFiles();
        return {
          type: "entry",
          script: assets[0],
          assets: assets
        };
      })()
    ],
    [
      "index.html",
      (() => {
        let assets = indexHtmlAssets.getFiles();
        return {
          type: "entry",
          script: assets[0],
          assets: assets
        };
      })()
    ]
  ]);

  return {
    ...manifest,
    ...entries
  };
}
