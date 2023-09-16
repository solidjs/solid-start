import { createMiddleware } from "@solidjs/start/server";
import { sendWebResponse } from "vinxi/runtime/server";

export default createMiddleware({
  onRequest: event => {
    sendWebResponse(event, new Response("Hello World!"));
  },
  onBeforeResponse: console.log
});
