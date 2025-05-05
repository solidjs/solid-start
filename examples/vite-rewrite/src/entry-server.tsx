// @refresh reload
import { createHandler, StartServer } from "@solidjs/start-vite/server";

// function bruh() {
//   "use server";
//   console.log("bruh");
// }

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => {
      return (
        <html lang="en">
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
      );
    }}
  />
));
