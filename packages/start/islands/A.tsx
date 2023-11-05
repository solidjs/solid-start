"use client";
import type { A as BaseA } from "@solidjs/router";
import { ComponentProps, splitProps } from "solid-js";
import { useLocation } from "./useLocation";

export default function IslandsA(props: ComponentProps<typeof BaseA>) {
  const [, rest] = splitProps(props, ["state", "activeClass", "inactiveClass", "end"]);
  const location = useLocation();
  const isActive = () => {
    return props.href.startsWith("#")
      ? location.hash === props.href
      : location.pathname === props.href;
  };

  return (
    <a
      link
      {...rest}
      state={JSON.stringify(props.state)}
      classList={{
        [props.inactiveClass || "inactive"]: !isActive(),
        [props.activeClass || "active"]: isActive(),
        ...rest.classList
      }}
      aria-current={isActive() ? "page" : undefined}
    >
      {rest.children}
    </a>
  );
}
