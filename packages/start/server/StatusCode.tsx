import { useContext, createRenderEffect, onCleanup } from "solid-js";
import { isServer } from "solid-js/web";
import { XSolidStartStatusCodeHeader } from "./responses";
import { StartContext } from "./StartContext";

export function StatusCode(props: { code: number }) {
  const context = useContext(StartContext);
  let prevCode;

  if (isServer) {
    prevCode = context.responseHeaders.has(XSolidStartStatusCodeHeader)
      ? parseInt(context.responseHeaders.get(XSolidStartStatusCodeHeader)!)
      : 200;
    context.setStatusCode(props.code);
  }

  onCleanup(() => {
    if (isServer) {
      context.setStatusCode(prevCode);
    }
  });

  return null;
}
