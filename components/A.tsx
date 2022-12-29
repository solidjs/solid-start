import { createEffect } from "solid-js";
import { A, useIsActive } from "solid-start";
import { useScrollIndicator } from "./ScrollIndicator";

// islands, like lazy, need to be default export
export default (props) => {
  let ref: HTMLAnchorElement | undefined;
  const setActiveEl = useScrollIndicator();
  const active = useIsActive(props.href);

  createEffect(() => {
    active() && setActiveEl(ref);
  });

  return <A {...props} ref={ref} />
}
