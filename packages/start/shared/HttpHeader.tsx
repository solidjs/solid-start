import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";

export function HttpHeader(props: { name: string; value: string; append?: boolean }) {
  if (isServer) {
    const event = getRequestEvent();
    if (event) onCleanup((event as any).components.header(props));
  }

  return null;
}
