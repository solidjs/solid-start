import { children, ComponentProps } from "solid-js";
import { insert, resolveSSRNode, ssrSpread } from "solid-js/web";
import Links from "./Links";
import Meta from "./Meta";
import Scripts from "./Scripts";

let spread = (props: any, isSvg: boolean, skipChildren: boolean) =>
  // @ts-ignore
  ssrSpread(props, isSvg, skipChildren);

export function Html(props: ComponentProps<"html">) {
  if (import.meta.env.MPA) {
  }
  if (import.meta.env.SSR) {
    return `<html ${spread(props, false, true)}>
        ${resolveSSRNode(children(() => props.children))}
      </html>
    `;
  } else return props.children;
}

export function Head(props: ComponentProps<"head">) {
  if (import.meta.env.SSR) {
    return `<head ${spread(props, false, true)}>
        ${resolveSSRNode(
          children(() => (
            <>
              {props.children}
              <Meta />
              <Links />
            </>
          ))
        )}
      </head>
    `;
  } else return props.children;
}

export function Body(props: ComponentProps<"body">) {
  if (import.meta.env.SSR) {
    return `<body ${spread(props, false, true)}>${
      import.meta.env.START_SSR
        ? resolveSSRNode(children(() => props.children))
        : resolveSSRNode(<Scripts />)
    }</body>`;
  } else {
    if (import.meta.env.START_SSR) {
      let child = children(() => props.children);
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
      return <>{props.children}</>;
    }
  }
}
