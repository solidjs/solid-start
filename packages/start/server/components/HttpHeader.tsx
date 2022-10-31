import { onCleanup } from "solid-js";
import { isServer } from "solid-js/web";
import { useRequest } from "../ServerContext";

export function HttpHeader(props: { name: string; value: string }) {
  const pageContext = useRequest();

  if (isServer) {
    pageContext.responseHeaders.set(props.name, props.value);
  }

  onCleanup(() => {
    if (isServer) {
      pageContext.responseHeaders.delete(props.name);
    }
  });

  return null;
}
