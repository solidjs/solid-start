import { createMiddleware } from "@solidjs/start/server";

export default createMiddleware({
  onRequest: console.log,
  onBeforeResponse: console.log
});
