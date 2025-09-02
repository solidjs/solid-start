export { getServerFunctionMeta } from "../shared/serverFunction.js";
export { StartServer } from "./StartServer.jsx";
export { createHandler } from "./handler.js";

export * from "./h3.js";

/**
 * Checks if user has set a redirect status in the response.
 * If not, falls back to the 302 (temporary redirect)
 */
// export function getExpectedRedirectStatus(response: ResponseStub): number {
//   if (response.status && validRedirectStatuses.has(response.status)) {
//     return response.status;
//   }

//   return 302;
// }
