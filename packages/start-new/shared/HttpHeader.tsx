import { onCleanup } from "solid-js";
import { getRequestEvent, isServer } from "solid-js/web";

export function HttpHeader(props: { name: string; value: string; append?: boolean }) {
  if (isServer) {
    const pageContext = getRequestEvent();
    if (props.append) {
      pageContext!.appendResponseHeader(props.name, props.value);
    } else {
      pageContext!.setResponseHeader(props.name, props.value);
    }

    onCleanup(() => {
      const value = pageContext!.getResponseHeader(props.name);

      // Todo: review this logic still the same in H3
      // H3 supports arrays so its possible there is no need to split..
      // typeof check here is to guard but ultimately may be unneeded
      if (value && typeof value === "string") {
        const values = value.split(", ");
        const index = values.indexOf(props.value);
        index !== -1 && values.splice(index, 1);
        if (values.length) pageContext!.setResponseHeader(props.name, values.join(", "));
        else pageContext!.removeResponseHeader(props.name);
      }
    });
  }

  return null;
}
