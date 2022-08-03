import manifest from "../../netlify/route-manifest.json";
import handler from "./handler";

export default request =>
handler({
    request,
    env: { manifest }
  });
