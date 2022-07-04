import { useContext, createRenderEffect, onCleanup } from "solid-js";
import { isServer } from "solid-js/web";
import { StartContext } from "./StartContext";

export function HttpHeader(props: { headers: object }) {
  const context = useContext(StartContext);
  createRenderEffect(() => {
    if (isServer) {
      for (const [name, value] of Object.entries(props.headers)) {
        context.responseHeaders.set(name, value);
      }
    }
  });

  onCleanup(() => {
    if (isServer) {
      console.log("cleaning up");
      for (const [name, value] of Object.entries(props.headers)) {
        context.responseHeaders.delete(name);
      }
    }
  });

  return null;
}
