import { onCleanup, useContext } from "solid-js";
import { isServer } from "solid-js/web";
import { ServerContext } from "../ServerContext";

export function HttpHeader(props: { name: string; value: string; append?: boolean }) {
  const pageContext = useContext(ServerContext);

  if (isServer) {
    if (props.append) {
      pageContext!.responseHeaders.append(props.name, props.value);
    } else {
      pageContext!.responseHeaders.set(props.name, props.value);
    }
  }

  onCleanup(() => {
    if (isServer) {
      const value = pageContext!.responseHeaders.get(props.name);
      if (value) {
        const values = value.split(", ");
        const index = values.indexOf(props.value);
        index !== -1 && values.splice(index, 1);
        if (values.length) pageContext!.responseHeaders.set(props.name, values.join(", "));
        else pageContext!.responseHeaders.delete(props.name);
      }
    }
  });

  return null;
}
