// @refresh skip
import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";
import type { PageEvent } from "../server/types";

export interface HttpStatusCodeProps {
  code: number;
  text?: string;
}

export const HttpStatusCode = isServer
  ? (props: HttpStatusCodeProps) => {
    const event = getRequestEvent() as PageEvent;
    event.response.status = props.code;
    event.response.statusText = props.text;
    onCleanup(() => !event.nativeEvent.handled && (event.response.status = 200));
    return null;
  }
  : (_props: HttpStatusCodeProps) => null;
