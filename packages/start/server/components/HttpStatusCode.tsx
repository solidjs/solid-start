import { onCleanup } from "solid-js";
import { isServer } from "solid-js/web";
import { useRequest } from "../ServerContext";

export function HttpStatusCode(props: { code: number }) {
  const context = useRequest();

  if (isServer) {
    context!.setStatusCode(props.code);
  }

  onCleanup(() => {
    if (isServer) {
      context!.setStatusCode(200);
    }
  });

  return null;
}
