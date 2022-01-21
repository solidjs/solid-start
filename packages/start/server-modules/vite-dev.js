import c from "picocolors";
export default function serverModule() {
  let config;
  return {
    name: "server-module-dev",
    configResolved(conf) {
      config = conf;
    },
    configureServer(vite) {
      vite.middlewares.use("/__server_module", async (req, res) => {
        let data = "";
        req.on("data", chunk => {
          data += chunk;
        });
        req.on("end", async () => {
          let args = JSON.parse(data);
          let mod = await vite.ssrLoadModule(args.filename);
          try {
            let response = await mod["__serverModule" + args.index](...args.args);
            res.write(JSON.stringify(response));
            res.end();
          } catch (e) {
            res.write("Not found");
            res.statusCode = 500;
            res.end();
          }
        });
      });

      vite.httpServer?.once("listening", async () => {
        const protocol = config.server.https ? "https" : "http";
        const port = config.server.port;
        const label = `  > Server modules: `;

        setTimeout(() => {
          // eslint-disable-next-line no-console
          console.log(`${label}${c.blue(`${protocol}://localhost:${port}/__server_module`)}`);
        }, 0);
      });
    }
  };
}
