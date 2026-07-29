import { createMemo, omit } from "solid-js";
import type { ComponentProps, JSX } from "@solidjs/web";
import { Dynamic } from "@solidjs/web";

import "./Text.css";

export type TextProps<T extends keyof JSX.IntrinsicElements = "span"> = ComponentProps<T> & {
  options?: {
    as?: T;
    size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
    font?: "sans" | "serif" | "mono";
    weight?:
      | "thin"
      | "extralight"
      | "light"
      | "normal"
      | "medium"
      | "semibold"
      | "bold"
      | "extrabold";
    wrap?: "wrap" | "nowrap";
  };
};

export function Text<T extends keyof JSX.IntrinsicElements = "span">(
  props: TextProps<T>,
): JSX.Element {
  const rest = omit(props, "options");

  const customization = createMemo<TextProps<T>>(() => {
    const options = Object.assign(
      {},
      {
        size: "base",
        font: "mono",
        weight: "normal",
        wrap: "wrap",
      },
      props.options,
    );
    const entries = Object.entries(options);
    return Object.fromEntries(
      entries.map(([key, value]) => [`data-start-text-${key}`, value]),
    ) as TextProps<T>;
  });

  return <Dynamic component={(props.options?.as || "span") as T} {...rest} {...customization()} />;
}
