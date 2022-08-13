import { ComponentProps } from "solid-js";
import { insert, resolveSSRNode, spread, ssrSpread } from "solid-js/web";
import Links from "./Links";
import Meta from "./Meta";
import Scripts from "./Scripts";

let _ssrSpread = (props: any, isSvg: boolean, skipChildren: boolean) =>
  // @ts-ignore
  ssrSpread(props, isSvg, skipChildren);

export function Html(props: ComponentProps<"html">) {
  if (import.meta.env.MPA) {
  }
  if (import.meta.env.SSR) {
    return `<html ${_ssrSpread(props, false, true)}>
        ${resolveSSRNode(props.children)}
      </html>
    `;
  } else {
    spread(document.documentElement, props, false, true);
    return props.children;
  }
}

export function Head(props: ComponentProps<"head">) {
  if (import.meta.env.SSR) {
    return `<head ${_ssrSpread(props, false, true)}>
        ${resolveSSRNode(
          <>
            {props.children}
            <Meta />
            <Links />
          </>
        )}
      </head>
    `;
  } else {
    spread(document.head, props, false, true);
    return props.children;
  }
}

export function Body(props: ComponentProps<"body">) {
  if (import.meta.env.SSR) {
    return `<body ${_ssrSpread(props, false, true)}>${
      import.meta.env.START_SSR
        ? resolveSSRNode(props.children)
        : resolveSSRNode(<Scripts />)
    }</body>`;
  } else {
    if (import.meta.env.START_SSR) {
      spread(document.body, props, false, true);
      insert(
        document.body,
        () => {
          let childNodes = props.children;
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
