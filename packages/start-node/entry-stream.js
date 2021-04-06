import { readFileSync } from "fs";
import { createServer } from "solid-adapter-node/server.js";
import preload from "solid-start/runtime/preload.js";
import manifest from "../dist/rmanifest.json";
import { render } from "./app";

const template = readFileSync("index.html", "utf-8");

createServer({
  render(req, res) {
    const ctx = {}
    
    const { stream, script } = render(req.url, ctx);

    const [htmlStart, htmlEnd] = template
      .replace(`<!--app-head-->`, script)
      .split(`<!--app-html-->`);

    res.statusCode = 200;
    res.setHeader("content-type", "text/html");

    res.write(htmlStart);
    stream.pipe(res, { end: false });

    stream.on("end", () => {
      res.write(htmlEnd);
      res.end();
    });
  }
});
