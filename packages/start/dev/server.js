import { once } from "events";
import path from "path";
import { Readable } from "stream";
import { createRequest } from "../node/fetch.js";
import "../node/globals.js";

export function createDevHandler(viteServer) {
  return async (req, res) => {
    try {
      if (req.url === "/favicon.ico") return;

      console.log(req.method, req.url);

      const entry = (await viteServer.ssrLoadModule(path.resolve("./src/entry-server"))).default;

      const webRes = await entry({
        request: createRequest(req),
        env: {}
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
