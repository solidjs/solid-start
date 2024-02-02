import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";

export function HttpStatusCode(props: { code: number, text?: string }) {
  if (isServer) {
    const event = getRequestEvent();
    event.response.status = props.code;
    event.response.statusText = props.text;
    onCleanup(() => !event.nativeEvent.handled && (event.response.status = 200));
  }
  return null;
}
