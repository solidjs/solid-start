import type { JSX } from "solid-js";
import { children, ComponentProps } from "solid-js";
import { escape, insert, NoHydration, spread, ssrElement } from "solid-js/web";
import Links from "./Links";
import Meta from "./Meta";
import Scripts from "./Scripts";

export function Html(props: ComponentProps<"html">) {
  if (import.meta.env.START_ISLANDS) {
    return NoHydration({
      get children() {
        return ssrElement("html", props, undefined, false) as unknown as JSX.Element;
      }
    });
  }
  if (import.meta.env.SSR) {
    return ssrElement("html", props, undefined, false) as unknown as JSX.Element;
  }
  spread(document.documentElement, props, false, true);
  return props.children;
}

export function Head(props: ComponentProps<"head">) {
  if (import.meta.env.SSR) {
    return ssrElement(
      "head",
      props,
      () => (
        <>
          {escape(props.children as string)}
          <Meta />
          <Links />
        </>
      ),
      false
    ) as unknown as JSX.Element;
  } else {
    spread(document.head, props, false, true);
    return props.children;
  }
}

export function Body(props: ComponentProps<"body">) {
  if (import.meta.env.SSR) {
    return ssrElement(
      "body",
      props,
      () => (import.meta.env.START_SSR ? escape(props.children as string) : <Scripts />),
      false
    ) as unknown as JSX.Element;
  } else {
    if (import.meta.env.START_SSR) {
      let child = children(() => props.children);
      spread(document.body, props, false, true);
      insert(
        document.body,
        () => {
          let childNodes = child();
          if (childNodes) {
            if (Array.isArray(childNodes)) {
              let els = childNodes.filter(n => Boolean(n));

              if (!els.length) {
                return null;
              }

              return els;
            }
            return childNodes;
          }
          return null;
        },
        null,
        [...document.body.childNodes]
      );

      return document.body;
    } else {
      spread(document.body, props, false, true);
      return props.children;
    }
  }
}
