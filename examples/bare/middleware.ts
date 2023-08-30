import { createMiddleware } from "./createMiddleware";

export default createMiddleware(({ forward }) => event => {
  console.log("Request received:", event.request.url);
  return forward(event);
});
