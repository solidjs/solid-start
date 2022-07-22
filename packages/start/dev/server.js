import { once } from "events";
import path from "path";
import { Readable } from "stream";
import { pathToFileURL } from "url";
import { createRequest } from "../node/fetch.js";
import "../node/globals.js";

// Vite doesn't expose this so we just copy the list for now
// https://github.com/vitejs/vite/blob/3edd1af56e980aef56641a5a51cf2932bb580d41/packages/vite/src/node/plugins/css.ts#L96
const style_pattern = /\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/;

export function createDevHandler(viteServer, config, options) {
  /**
   * @returns {Promise<Response>}
   */
  async function devFetch(request, env) {
    const entry = (await viteServer.ssrLoadModule(path.resolve("./src/entry-server"))).default;

    return await entry({
      request,
      env: {
        ...env,
        devManifest: options.router.getFlattenedPageRoutes(true),
        collectStyles: async match => {
          const styles = {};
          const deps = new Set();
          for (var file of match) {
            await viteServer.ssrLoadModule(path.resolve(file));
            const node = await viteServer.moduleGraph.getModuleByUrl(
              pathToFileURL(`./${file}`).pathname.toString()
            );

            await find_deps(viteServer, node, deps);
          }

          for (const dep of deps) {
            const parsed = new URL(dep.url, "http://localhost/");
            const query = parsed.searchParams;

            if (
              style_pattern.test(dep.file) ||
              (query.has("svelte") && query.get("type") === "style")
            ) {
              try {
                const mod = await viteServer.ssrLoadModule(dep.url);
                styles[dep.url] = mod.default;
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
    });
  }

  async function handler(req, res) {
    try {
      let webRes = await devFetch(createRequest(req));
      res.statusCode = webRes.status;
      res.statusMessage = webRes.statusText;

      for (const [name, value] of webRes.headers) {
        res.setHeader(name, value);
      }

      if (webRes.body) {
        const readable = Readable.from(webRes.body);
        readable.pipe(res);
        await once(readable, "end");
      } else {
        res.end();
      }
    } catch (e) {
      viteServer && viteServer.ssrFixStacktrace(e);
      console.log("ERROR", e);
      res.statusCode = 500;
      res.end(e.stack);
    }
  }

  return { fetch: devFetch, handler };
}

/**
 * @param {import('vite').ViteDevServer} vite
 * @param {import('vite').ModuleNode} node
 * @param {Set<import('vite').ModuleNode>} deps
 */
async function find_deps(vite, node, deps) {
  // since `ssrTransformResult.deps` contains URLs instead of `ModuleNode`s, this process is asynchronous.
  // instead of using `await`, we resolve all branches in parallel.
  /** @type {Promise<void>[]} */
  const branches = [];

  /** @param {import('vite').ModuleNode} node */
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
