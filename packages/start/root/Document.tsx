import { children } from "solid-js";
import { isServer, resolveSSRNode } from "solid-js/web";
import Links from "./Links";
import Meta from "./Meta";
import Scripts from "./Scripts";

export function Html(props) {
  if (isServer) {
    return `<html>
        ${resolveSSRNode(children(() => props.children))}
      </html>
    `;
  }

  return <>{props.children}</>;
}

export function Head(props) {
  if (isServer) {
    return `<head>
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
  }
  return <>{props.children}</>;
}

export function Body(props) {
  if (isServer) {
    console.log(import.meta.env.START_SSR, import.meta.env.SSR);
    return `<body>${
      import.meta.env.START_SSR
        ? resolveSSRNode(children(() => props.children))
        : resolveSSRNode(<Scripts />)
    }</body>`;
  }

  return <>{children(() => props.children)}</>;
}
