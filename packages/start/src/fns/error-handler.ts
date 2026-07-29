import onServerFunctionError from "solid-start:server-fn-error-handler";

/**
 * Handles whatever a server function threw, before it reaches the client. Use
 * it to type the default export of the module named by the
 * `serverFunctions.onError` option in `vite.config.ts`.
 *
 * The handler may be asynchronous. SolidStart awaits its return value before
 * sending the error to the client.
 *
 * @param thrown The value the server function threw. This is a `Response` when
 * the server function threw control flow such as a `redirect()`.
 * @returns `undefined` (or `null`) to send `thrown` unchanged, a `Response` to
 * preserve control flow, any other replacement value, or a promise resolving
 * to any of those values.
 *
 * @example
 * ```ts
 * // src/server-fn-error.ts
 * import type { ServerFunctionErrorHandler } from "@solidjs/start/server";
 * import { captureException } from "./your-monitoring-client";
 *
 * const onServerFunctionError: ServerFunctionErrorHandler = thrown => {
 *   // redirect() throws a Response, so returning it preserves that control flow.
 *   if (thrown instanceof Response) return thrown;
 *
 *   captureException(thrown); // or console.error, or any reporter
 *   return new Error("Something went wrong");
 * };
 *
 * export default onServerFunctionError;
 * ```
 */
export type ServerFunctionErrorHandler = (thrown: unknown) => unknown;

export async function applyServerFunctionErrorHandler(thrown: unknown): Promise<unknown> {
  const replacement = await onServerFunctionError?.(thrown);
  return replacement ?? thrown;
}
