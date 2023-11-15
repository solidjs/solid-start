import { createMiddleware, getH3Event } from "@solidjs/start/server";
import { appendCorsHeaders } from "vinxi/server";

export default createMiddleware({
  onRequest: [
    event => {
      console.log("GLOBAL", event.request.url);
    },
    event => {
      appendCorsHeaders(getH3Event(event), {});
      // return new Response("Hello World!");
    }
  ]
});
