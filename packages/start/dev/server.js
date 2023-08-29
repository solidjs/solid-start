import debug from "debug";
import path from "path";

import { createRequest, handleNodeResponse } from "../node/fetch.js";
import "../node/globals.js";

// @ts-ignore
globalThis._$DEBUG = debug("start:server");

// Vite doesn't expose this so we just copy the list for now
// https://github.com/vitejs/vite/blob/3edd1af56e980aef56641a5a51cf2932bb580d41/packages/vite/src/node/plugins/css.ts#L96
const style_pattern = /\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/;
const module_style_pattern = /\.module\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/;

process.on(
  "unhandledRejection",
  /** @param {Error | string} err */ err => {
    if (
      !(typeof err === "string"
        ? err.includes("renderToString timed out")
        : err.message
        ? err.message.includes("renderToString timed out")
        : false)
    ) {
      console.error(
        `An unhandled error occured: ${typeof err === "string" ? err : err.stack || err}`
      );
    }
  }
);

/**
 *
 * @param {import('node_modules/vite').ViteDevServer} viteServer
 * @param {*} config
 * @param {*} options
 * @returns
 */
export function createDevHandler(viteServer, config, options) {
  /**
   * @returns {Promise<Response>}
   */
  async function devFetch({ request, env, clientAddress, locals }) {
    const entry = (await viteServer.ssrLoadModule("~start/entry-server")).default;

    const devEnv = {
      ...env,
      __dev: {
        manifest: options.router.getFlattenedPageRoutes(true),
        collectStyles: async (/** @type {string[]} */ match) => {
          /** @type {{ [key: string]: string}} */
          const styles = {};
          const deps = new Set();

          try {
            for (const file of match) {
              const normalizedPath = path.resolve(file).replace(/\\/g, "/");
              let node = await viteServer.moduleGraph.getModuleById(normalizedPath);
              if (!node) {
                const absolutePath = path.resolve(file);
                await viteServer.ssrLoadModule(absolutePath);
                node = await viteServer.moduleGraph.getModuleByUrl(absolutePath);

                if (!node) {
                  console.log("not found");
                  return;
                }
              }

              await find_deps(viteServer, node, deps);
            }
          } catch (e) {}

          for (const dep of deps) {
            const parsed = new URL(dep.url, "http://localhost/");
            const query = parsed.searchParams;

            if (style_pattern.test(dep.file)) {
              try {
                const mod = await viteServer.ssrLoadModule(dep.url);
                if (module_style_pattern.test(dep.file)) {
                  styles[dep.url] = env.cssModules?.[dep.file];
                } else {
                  styles[dep.url] = mod.default;
                }
              } catch {
                // this can happen with dynamically imported modules, I think
                // because the Vite module graph doesn't distinguish between
                // static and dynamic imports? TODO investigate, submit fix
              }
            }
          }
          return styles;
        }
      }
    };

    function internalFetch(/** @type {string} */ route, init = {}) {
      let url = new URL(route, request.url);

      const internalRequest = new Request(url.href, init);

      return entry({
        request: internalRequest,
        httpServer: viteServer.httpServer,
        env: devEnv,
        fetch: internalFetch
      });
    }

    return await entry({
      request,
      httpServer: viteServer.httpServer,
      env: devEnv,
      clientAddress,
      locals,
      fetch: internalFetch
    });
  }

  let localEnv = { cssModules: {} };

  /**
   *
   * @param {import('http').IncomingMessage} req
   * @param {*} res
   */
  async function startHandler(req, res) {
    try {
      if (viteServer.resolvedUrls) {
        const url = viteServer.resolvedUrls.local[0];
        console.log(req.method, new URL(req.url ?? "/", url).href);
      }
      let webRes = await devFetch({
        request: createRequest(req),
        env: localEnv,
        clientAddress: req.socket.remoteAddress,
        locals: {}
      });
      handleNodeResponse(webRes, res);
    } catch (e) {
      viteServer && viteServer.ssrFixStacktrace(e);
      res.statusCode = 500;
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Error</title>
            <script type="module">
              import { ErrorOverlay } from '/@vite/client'
              document.body.appendChild(new ErrorOverlay(${JSON.stringify(
                prepareError(req, e)
              ).replace(/</g, "\\u003c")}))
            </script>
          </head>
          <body>
          </body>
        </html>
      `);
      throw e;
    }
  }

  return {
    fetch: devFetch,
    handler: startHandler,
    handlerWithEnv: (/** @type {any} */ env) => {
      localEnv = env;
      return startHandler;
    }
  };
}

/**
 * @param {import('node_modules/vite').ViteDevServer} vite
 * @param {import('node_modules/vite').ModuleNode} node
 * @param {Set<import('node_modules/vite').ModuleNode>} deps
 */
async function find_deps(vite, node, deps) {
  // since `ssrTransformResult.deps` contains URLs instead of `ModuleNode`s, this process is asynchronous.
  // instead of using `await`, we resolve all branches in parallel.
  /** @type {Promise<void>[]} */
  const branches = [];

  /** @param {import('node_modules/vite').ModuleNode} node */
  async function add(node) {
    if (!deps.has(node)) {
      deps.add(node);
      await find_deps(vite, node, deps);
    }
  }

  /** @param {string} url */
  async function add_by_url(url) {
    const node = await vite.moduleGraph.getModuleByUrl(url);

    if (node) {
      await add(node);
    }
  }

  if (node.ssrTransformResult) {
    if (node.ssrTransformResult.deps) {
      node.ssrTransformResult.deps.forEach(url => branches.push(add_by_url(url)));
    }

    // if (node.ssrTransformResult.dynamicDeps) {
    //   node.ssrTransformResult.dynamicDeps.forEach(url => branches.push(add_by_url(url)));
    // }
  } else {
    node.importedModules.forEach(node => branches.push(add(node)));
  }

  await Promise.all(branches);
}

function prepareError(/** @type {import('http').IncomingMessage} */ req, /** @type {Error} */ e) {
  return {
    message: `An error occured while server rendering ${req.url}:\n\n\t${
      typeof e === "string" ? e : e.message
    } `,
    stack: typeof e === "string" ? "" : e.stack
  };
}
