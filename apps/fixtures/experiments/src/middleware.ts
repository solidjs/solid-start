import { getRequestURL } from "@solidjs/start/http";
import { createMiddleware } from "@solidjs/start/middleware";

export default createMiddleware({
  onRequest: [
    event => {
      event.locals.foo = "bar";
      console.log("REQUEST", event.request.url);
      console.log(
        "SEARCH PARAM KEYS FROM ASYNC CONTEXT",
        Array.from(getRequestURL().searchParams.keys()),
      );
    },
  ],
  onBeforeResponse: [
    (event, { body }) => {
      console.log("BEFORE RESPONSE", body);
    },
  ],
});
