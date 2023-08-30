import { createMiddleware } from "@solidjs/start/server";

export default createMiddleware(({ forward }) => event => {
  console.log("Request received:", event.request.url);
  return forward(event);
});
