import { useContext, createRenderEffect } from "solid-js";
import { isServer } from "solid-js/web";
import { StartContext } from "./StartContext";

export function StatusCode(props: { code: number }) {
  const context = useContext(StartContext);
  createRenderEffect(() => {
    if (isServer) {
      context.setStatusCode(props.code);
    }
  });
  return null;
}
