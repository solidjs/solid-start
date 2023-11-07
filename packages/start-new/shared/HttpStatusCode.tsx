import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";

export function HttpStatusCode(props: { code: number, text?: string }) {
  if (isServer) {
    const context = getRequestEvent();
    context!.setResponseStatus(props.code, props.text);
    onCleanup(() => {
      context!.setResponseStatus(200);
    });
  }
  return null;
}
