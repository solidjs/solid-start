import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";
import { setResponseStatus } from "vinxi/server";

export function HttpStatusCode(props: { code: number, text?: string }) {
  if (isServer) {
    const context = getRequestEvent()!;
    setResponseStatus(context, props.code, props.text);
    onCleanup(() => {
      setResponseStatus(context, 200);
    });
  }
  return null;
}
