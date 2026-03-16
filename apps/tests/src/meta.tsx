import { children, createRenderEffect, type JSX, type ParentProps } from "solid-js";

export function MetaProvider(props: ParentProps) {
  return props.children;
}

export function Title(props: { children?: JSX.Element }) {
  const resolved = children(() => props.children);

  if (!import.meta.env.SSR) {
    createRenderEffect(() => {
      const value = resolved.toArray().join("");
      if (value) {
        document.title = value;
      }
    });
  }

  return null;
}
