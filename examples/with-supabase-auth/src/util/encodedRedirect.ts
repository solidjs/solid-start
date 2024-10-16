import { CustomResponse, redirect } from "@solidjs/router";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
): CustomResponse<never> {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}
