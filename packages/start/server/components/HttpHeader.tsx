import { onCleanup, useContext } from "solid-js";
import { isServer } from "solid-js/web";
import { ServerContext } from "../ServerContext";

export function HttpHeader(props: { headers: object }) {
  const pageContext = useContext(ServerContext);

  if (isServer) {
    for (const [name, value] of Object.entries(props.headers)) {
      pageContext.responseHeaders.set(name, value);
    }
  }

  onCleanup(() => {
    if (isServer) {
      console.log("cleaning up");
      for (const [name] of Object.entries(props.headers)) {
        pageContext.responseHeaders.delete(name);
      }
    }
  });

  return null;
}
