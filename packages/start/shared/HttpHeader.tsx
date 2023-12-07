import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";
import { appendResponseHeader, getResponseHeader, removeResponseHeader, setResponseHeader } from "vinxi/server";

export function HttpHeader(props: { name: string; value: string; append?: boolean }) {
  if (isServer) {
    const event = getRequestEvent();
    if (props.append) {
      appendResponseHeader(event, props.name, props.value);
    } else {
      setResponseHeader(event, props.name, props.value);
    }

    onCleanup(() => {
      const value = getResponseHeader(event, props.name);

      // Todo: review this logic still the same in H3
      // H3 supports arrays so its possible there is no need to split..
      // typeof check here is to guard but ultimately may be unneeded
      if (value && typeof value === "string") {
        const values = value.split(", ");
        const index = values.indexOf(props.value);
        index !== -1 && values.splice(index, 1);
        if (values.length) setResponseHeader(event, props.name, values.join(", "));
        else removeResponseHeader(event, props.name);
      }
    });
  }

  return null;
}
