import onServerFunctionError from "solid-start:server-fn-error-handler";

export type ServerFunctionErrorHandler = (thrown: unknown) => unknown;

/** @internal */
export function applyServerFunctionErrorHandler(thrown: unknown): unknown {
  return onServerFunctionError?.(thrown) ?? thrown;
}
