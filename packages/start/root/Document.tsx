import { children, ComponentProps, createRenderEffect } from "solid-js";
import { insert, resolveSSRNode, ssrSpread } from "solid-js/web";
import Links from "./Links";
import Meta from "./Meta";
import Scripts from "./Scripts";

export function Html(props: ComponentProps<"html">) {
  if (import.meta.env.MPA) {
  }
  if (import.meta.env.SSR) {
    let { children: c, ...htmlProps } = props;

    return `<html ${ssrSpread(htmlProps)}>
        ${resolveSSRNode(children(() => props.children))}
      </html>
    `;
  } else {
    if (import.meta.env.START_SSR) {
      createRenderEffect(() => {
        children(() => props.children);
      });

      return document;
    }

    return <>{props.children}</>;
  }
}

export function Head(props: ComponentProps<"head">) {
  if (import.meta.env.SSR) {
    let { children: c, ...headProps } = props;
    return `<head ${ssrSpread(headProps)}>
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
  } else {
    if (import.meta.env.START_SSR) {
      createRenderEffect(() => {
        children(() => props.children);
      });

      return document.head;
    }

    return <>{props.children}</>;
  }
}

export function Body(props: ComponentProps<"body">) {
  if (import.meta.env.SSR) {
    let { children: c, ...bodyProps } = props;
    return `<body ${ssrSpread(bodyProps)}>${
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
