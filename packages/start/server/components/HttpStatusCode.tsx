import { onCleanup, useContext } from "solid-js";
import { isServer } from "solid-js/web";
import { ServerContext } from "../ServerContext";

export function HttpStatusCode(props: { code: number }) {
  const context = useContext(ServerContext);

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
