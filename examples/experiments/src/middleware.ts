import { appendCorsHeaders, createMiddleware } from "@solidjs/start/server";

export default createMiddleware({
  onRequest: [
    event => {
      console.log("REQUEST", event.request.url);
    },
    event => {
      appendCorsHeaders(event, {});
      // return new Response("Hello World!");
    }
  ],
  onBeforeResponse: [
    (event, { body }) => {
      console.log("BEFORE RESPONSE", body);
    }
  ]
});
