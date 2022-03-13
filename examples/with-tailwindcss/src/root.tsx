// @refresh reload
import { Links, Meta, Routes, Scripts } from "solid-start/root";
import "./index.css";

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body class="antialiased">
        <Routes />
        <Scripts />
      </body>
    </html>
  );
}
