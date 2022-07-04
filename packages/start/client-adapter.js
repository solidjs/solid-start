import { join, resolve } from "path";
import vite from "vite";
import connect from "connect";
import http from "http";
import compression from "compression";
import sirv from "sirv";

export function solidStartClientAdpater() {
  return {
    async start(config) {
      var app = connect();
      app.use(compression());
      app.use(config.base, sirv(join(config.root, "dist")));
      app.use(async (req, res) => {
        return (await import("fs")).readFile(
          join(config.root, "dist/index.html"),
          "utf8",
          (err, data) => {
            if (err) {
              res.statusCode = 500;
              res.end(`Error: ${err.message}`);
            } else {
              res.end(data);
            }
          }
        );
      });
      const { PORT = 3000 } = process.env;
      http.createServer(app).listen(PORT);
      console.log(`Listening on http://localhost:${PORT}`);
      return;
    },
    async build(config) {
      await vite.build({
        root: join(config.root),
        // out: "./dist/",
        build: {
          outDir: "./dist/",
          rollupOptions: {
            input: resolve(join(config.root, "index.html")),
            output: {
              manualChunks: undefined
            }
          },
          minify: "terser"
        }
      });
    }
  };
}
