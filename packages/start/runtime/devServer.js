import path from "path";
import { Readable } from "stream";
import { once } from "events";
import { Headers } from "undici";
import { createRequest } from "./fetch.js";
import "./node-globals.js";

// Vite doesn't expose this so we just copy the list for now
// https://github.com/vitejs/vite/blob/3edd1af56e980aef56641a5a51cf2932bb580d41/packages/vite/src/node/plugins/css.ts#L96
const style_pattern = /\.(css|less|sass|scss|styl|stylus|pcss|postcss)$/;

export function createDevHandler(viteServer) {
  return async (req, res) => {
    try {
      if (req.url === "/favicon.ico") return;

      console.log(req.method, req.url);

      let moduleURL = path.resolve("./src/entry-server");
      const entry = (await viteServer.ssrLoadModule(moduleURL)).default;

      const node = await viteServer.moduleGraph.getModuleByUrl(moduleURL);

      if (!node) throw new Error(`Could not find node for ${moduleURL}`);
      console.log(node);

      const deps = new Set();
      await find_deps(viteServer, node, deps);

      console.log(deps);

      /** @type {Record<string, string>} */
      const styles = {};

      for (const dep of deps) {
        const parsed = new URL(dep.url, "http://localhost/");
        const query = parsed.searchParams;

        if (style_pattern.test(dep.file)) {
          try {
            const mod = await viteServer.ssrLoadModule(dep.url, { fixStacktrace: false });
            styles[dep.url] = mod.default;
          } catch {
            // this can happen with dynamically imported modules, I think
            // because the Vite module graph doesn't distinguish between
            // static and dynamic imports? TODO investigate, submit fix
          }
        }
      }

      console.log(styles);

      const webRes = await entry({
        request: createRequest(req),
        responseHeaders: new Headers()
      });

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
  };
}

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
  } else {
    node.importedModules.forEach(node => branches.push(add(node)));
  }

  await Promise.all(branches);
}
