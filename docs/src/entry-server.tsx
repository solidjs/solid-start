import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => {
  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>SolidStart: Fine-Grained Reactivity goes fullstack</title>
            <meta
              property="og:title"
              content="SolidStart: Fine-Grained Reactivity goes fullstack"
            />
            <meta name="keywords" content="SolidStart, Solid, SolidJS, Solid.js, JavaScript" />
            <meta
              name="description"
              content="SolidStart is a JavaScript Framework designed to build SolidJS apps and deploy them to a variety of providers."
            />
            <meta
              property="og:description"
              content="SolidStart is a JavaScript Framework designed to build SolidJS apps and deploy them to a variety of providers."
            />
            <meta property="og:site_name" content="SolidStart" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@solid_js" />
            <meta property="og:image" content="https://start.solidjs.com/start_og.png" />
            <meta property="twitter:image" content="https://start.solidjs.com/start_og.png" />
            <link rel="icon" href="/favicon.ico" />
            {assets}
          </head>
          <body class="overflow-x-hidden max-w-screen">
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  );
});
