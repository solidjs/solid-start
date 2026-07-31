// @refresh skip
import { httpHeader } from "@solidjs/web";

export interface HttpHeaderProps {
  name: string;
  value: string;
  append?: boolean;
}

/**
 * Component wrapper over the `httpHeader` primitive from `@solidjs/web`,
 * kept for compatibility with Start's historical component API.
 *
 * @deprecated Call the `httpHeader(name, value, { append })` primitive from
 * `@solidjs/web` directly in a component or reactive-scope body instead.
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/http-header
 */
export const HttpHeader = (props: HttpHeaderProps) => {
  httpHeader(props.name, props.value, { append: props.append });
  return null;
};
