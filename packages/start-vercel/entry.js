import manifest from "../../.vercel/output/static/route-manifest.json";
import entry from "./entry-server";

export default function (request) {
  const response = entry({
    request,
    env: { manifest }
  });
  return response;
}
