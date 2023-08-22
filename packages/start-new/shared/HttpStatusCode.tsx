import { onCleanup } from "solid-js";
import { isServer } from "solid-js/web";
import { useRequest } from "./ServerContext";

export function HttpStatusCode(props: { code: number, text?: string }) {
  if (isServer) {
    const context = useRequest();
    context!.setResponseStatus(props.code, props.text);
    onCleanup(() => {
      context!.setResponseStatus(200);
    });
  }
  return null;
}
