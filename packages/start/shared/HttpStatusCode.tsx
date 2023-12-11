import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";

export function HttpStatusCode(props: { code: number, text?: string }) {
  if (isServer) {
    const event = getRequestEvent();
    if (event) onCleanup((event as any).components.status(props));
  }
  return null;
}
