import { createMiddleware } from "@solidjs/start/server";

export default createMiddleware({
  onRequest: event => {
    console.log(event.path);
  },
  onBeforeResponse: (event, res) => {
    console.log(event.path, res.status);
  }
});
