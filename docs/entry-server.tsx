import { StartServer, createHandler, type DocumentComponentProps } from "@solidjs/start/server";

function Document({ assets, children, scripts }: DocumentComponentProps) {
  return (
    <html lang="en" class="h-full">
      <head>
        <meta charset="utf-8" />
        <meta property="og:title" content="SolidStart Beta Documentation" />
        <meta property="og:site_name" content="SolidStart Beta Documentation" />
        <meta property="og:url" content="https://start.solidjs.com" />
        <meta
          property="og:description"
          content="Early release documentation and resources for SolidStart Beta"
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://start.solidjs.com/og-share.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta
          name="description"
          property="og:description"
          content="Early release documentation and resources for SolidStart Beta"
        />
        <meta name="author" content="@solid_js" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />
        {assets}
      </head>
      <body id="app" class="h-full grid grid-cols-[auto,1fr,auto] grid-rows-[auto,1fr]">
        {children}
        {scripts}
        <script src="https://cdn.jsdelivr.net/npm/@docsearch/js@3"></script>
        <script>
          {`docsearch({
            appId: "VTVVKZ36GX",
            apiKey: "f520312c8dccf1309453764ee2fed27e",
            indexName: "solidjs",
            container: "#docsearch",
            debug: false
          });`}
        </script>
      </body>
    </html>
  );
}

export default createHandler(() => <StartServer document={Document} />);
