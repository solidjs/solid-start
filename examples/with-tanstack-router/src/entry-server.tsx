// @refresh reload
import { createHandler, FetchEvent, StartServer } from "@solidjs/start/server";
import { createMemoryHistory } from "@tanstack/solid-router";
import { router } from "./router";

const routerLoad = async (event: FetchEvent) => {
  const url = new URL(event.request.url);
  const path = url.href.replace(url.origin, "");

  router.update({
    history: createMemoryHistory({
      initialEntries: [path]
    })
  });

  await router.load();
};

export default createHandler(
  () => (
    <StartServer
      document={({ assets, children, scripts }) => (
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
      )}
    />
  ),
  undefined,
  routerLoad
);
