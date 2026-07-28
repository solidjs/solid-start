export type ServerFunctionErrorHandler = (thrown: unknown) => unknown;

let errorHandler: ServerFunctionErrorHandler | undefined;

/**
 * Registers a handler for errors thrown by server functions, called before the
 * error is serialized into the response.
 *
 * Return a value to send it in place of what was thrown, or `undefined` to
 * send the original. Pass `undefined` to unregister.
 *
 * @example
 * ```ts
 * import { setServerFunctionErrorHandler } from "@solidjs/start/fns/server";
 *
 * setServerFunctionErrorHandler(error => {
 *   reportToMonitoring(error);
 *   return new Error("Internal server error");
 * });
 * ```
 */
export function setServerFunctionErrorHandler(
  handler: ServerFunctionErrorHandler | undefined,
): void {
  errorHandler = handler;
}

/** @internal */
export function applyServerFunctionErrorHandler(thrown: unknown): unknown {
  return errorHandler?.(thrown) ?? thrown;
}
