import type { Component, ComponentProps } from "solid-js";
import { omit } from "solid-js";

import { cn } from "~/lib/utils";

const Label: Component<ComponentProps<"label">> = props => {
  const rest = omit(props, "class");
  return (
    <label
      class={cn(
        "text-3xl text-neutral-300 font-thin leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        props.class,
      )}
      {...rest}
    />
  );
};

export { Label };
