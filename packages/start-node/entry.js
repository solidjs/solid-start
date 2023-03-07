import { dirname, join } from "path";
import { createServer } from "solid-start-node/server.js";
import "solid-start/node/globals.js";
import { fileURLToPath } from "url";
import manifest from "../../dist/public/route-manifest.json";
import handler from "./entry-server.js";

const { PORT = 3000 } = process.env;

const __dirname = dirname(fileURLToPath(import.meta.url));
const paths = {
  assets: join(__dirname, "/public")
};

const server = createServer({
  paths,
  handler,
  env: { manifest },
});

server.listen(PORT, err => {
  if (err) {
    console.log("error", err);
  } else {
    console.log(`Listening on port ${PORT}`);
  }
});
