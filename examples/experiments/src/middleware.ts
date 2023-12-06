import { appendCorsHeaders, createMiddleware } from "@solidjs/start/server";

export default createMiddleware({
  onRequest: [
    event => {
      console.log("GLOBAL", event.request.url);
    },
    event => {
      appendCorsHeaders(event, {});
      // return new Response("Hello World!");
    }
  ]
});
