import { Title } from "@solidjs/meta";
import { createHandler, StartServer } from "@solidjs/start/server";

function Document(props) {
  return (
    <html lang="en">
      <head>
        <Title>SolidStart - Hacker News</Title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Hacker News Clone built with Solid" />
        <link rel="manifest" href="/manifest.webmanifest" />
        {props.assets}
      </head>
      <body>
        <div id="app">{props.children}</div>
        {props.scripts}
      </body>
    </html>
  );
}

export default createHandler(context => <StartServer context={context} document={Document} />);
