// @refresh skip
import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";
import type { PageEvent } from "../server/types";

export interface HttpHeaderProps {
  name: string;
  value: string;
  append?: boolean;
}

/**
 *
 * Read more: https://docs.solidjs.com/solid-start/reference/server/http-header
 */
export const HttpHeader = isServer
  ? (props: HttpHeaderProps) => {
      const event = getRequestEvent() as PageEvent;

      if (props.append) event.response.headers.append(props.name, props.value);
      else event.response.headers.set(props.name, props.value);

      onCleanup(() => {
        if (event.nativeEvent.handled || event.complete) return;
        const value = event.response.headers.get(props.name);
        if (!value) return;
        if (!value.includes(", ")) {
          if (value === props.value) event.response.headers.delete(props.name);
          return;
        }
        const values = value.split(", ");
        const index = values.indexOf(props.value);
        index !== -1 && values.splice(index, 1);
        if (values.length) event.response.headers.set(props.name, values.join(","));
        else event.response.headers.delete(props.name);
      });
      return null;
    }
  : (_props: HttpHeaderProps) => null;
