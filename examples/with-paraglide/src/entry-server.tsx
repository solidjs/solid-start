// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import {langServerMiddleware} from "~/lang/core";

export default createHandler((event) => (<StartServer
    document={({ assets, children, scripts }) => (
      <html lang={langServerMiddleware(event)}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {assets}
      </head>
      <body>
      <div id="app">{children}</div>
      {scripts}
      </body>
      </html>
    )}
  />
));

