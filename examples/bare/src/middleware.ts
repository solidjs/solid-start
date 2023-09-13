import { createMiddleware } from "@solidjs/start/server";

export default createMiddleware(event => {
  console.log("Request received:", event.request.url);
  // return forward(event);
  // return h.$fetch(event.request.url, {
  //   headers: {
  //     "X-Forwarded": "By SolidJS"
  //   }
  // });
});
