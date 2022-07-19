import { readFileSync } from "fs";
import { dirname, join } from "path";
import { createRequest } from "solid-start/node/fetch.js";
import "solid-start/node/globals.js";
import { fileURLToPath } from "url";
import handler from "./handler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "dist", "public", "route-manifest.json"), "utf-8")
);

export default async req => {
  req.headers = {};
  req.method = "GET";
  const webRes = await handler({
    request: createRequest(req),
    env: { manifest }
  });
  return webRes.text();
};
