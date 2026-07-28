import type { ServerFunctionErrorHandler } from "@solidjs/start/server";

/**
 * Wired up through `serverFunctions.onError`. Unlike `seroval-plugins.ts` this
 * module is bundled into the server only, so it may reach for server-only code.
 *
 * Returning `undefined` sends whatever was thrown, which is what leaves the
 * other server-function error tests in this app seeing their own errors.
 */
const onServerFunctionError: ServerFunctionErrorHandler = thrown => {
  if (thrown instanceof Error && thrown.message === "replace me") {
    return new Error("replaced by onError");
  }
  return undefined;
};

export default onServerFunctionError;
