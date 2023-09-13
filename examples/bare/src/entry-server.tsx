import { StartServer, createHandler, type DocumentComponentProps } from "@solidjs/start/server";
import { defineRequestMiddleware, defineResponseMiddleware } from "vinxi/runtime/server";

function Document({ assets, children, scripts }: DocumentComponentProps) {
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
}

export default createHandler(context => <StartServer context={context} document={Document} />, {
  onRequest: [
    defineRequestMiddleware(event => {
      const id = Math.random().toString();
      console.time(`request ${id} ${event.path}`);
      event.id = id;
    })
  ],
  onBeforeResponse: [
    defineResponseMiddleware((event, response) => {
      console.timeEnd(`request ${event.id} ${event.path}`);
    })
  ]
});
