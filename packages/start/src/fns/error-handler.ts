import onServerFunctionError from "solid-start:server-fn-error-handler";

/**
 * Handles whatever a server function threw, before it reaches the client. Use
 * it to type the default export of the module named by the
 * `serverFunctions.onError` option in `vite.config.ts`.
 *
 * May be asynchronous. A returned promise settles before the error is sent to
 * the client.
 *
 * @param thrown The value the server function threw. This is a `Response` when
 * the server function threw control flow such as a `redirect()`.
 * @returns A value or promise resolving to `undefined` (or `null`) to send
 * `thrown` unchanged, a `Response` to pass control flow through untouched, or
 * any other value to send in place of `thrown`.
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
