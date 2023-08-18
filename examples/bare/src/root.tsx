// @refresh reload
import { A } from "@solidjs/router";
import { Suspense } from "solid-js";
import "./root.css";

export default function App(props) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {props.assets}
      </head>
      <body>
        <A href="/">Index</A>
        <A href="/about">About</A>
        <Suspense>{props.children}</Suspense>
        {props.scripts}
      </body>
    </html>
  );
}
