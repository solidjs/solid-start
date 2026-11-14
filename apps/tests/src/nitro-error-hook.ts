import { definePlugin } from "nitro";

/**
 * Names the error that Nitro's `error` hook received for a request in a header
 * of its response, so a test can tell that the error reached the server.
 */
export default definePlugin(nitroApp => {
  const errors = new WeakMap<object, string>();

  nitroApp.hooks.hook("error", (error, { event }) => {
    if (event) errors.set(event.req, error.message);
  });

  nitroApp.hooks.hook("response", (response, event) => {
    const message = errors.get(event.req);
    if (message) response.headers.set("x-nitro-error-hook", message);
  });
});
