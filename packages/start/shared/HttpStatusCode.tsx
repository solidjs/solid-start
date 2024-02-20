import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";
import type { PageEvent } from "../server/types";

export function HttpStatusCode(props: { code: number, text?: string }) {
  if (isServer) {
    const event = getRequestEvent() as PageEvent;
    event.response.status = props.code;
    event.response.statusText = props.text;
    onCleanup(() => !event.nativeEvent.handled && (event.response.status = 200));
  }
  return null;
}
