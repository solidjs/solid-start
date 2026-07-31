// @refresh skip
import { httpStatus } from "@solidjs/web";

export interface HttpStatusCodeProps {
  code: number;
  text?: string;
}

/**
 * Component wrapper over the `httpStatus` primitive from `@solidjs/web`,
 * kept for compatibility with Start's historical component API.
 *
 * @deprecated Call the `httpStatus(code, text?)` primitive from
 * `@solidjs/web` directly in a component or reactive-scope body instead.
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/http-status-code
 */
export const HttpStatusCode = (props: HttpStatusCodeProps) => {
  httpStatus(props.code, props.text);
  return null;
};
