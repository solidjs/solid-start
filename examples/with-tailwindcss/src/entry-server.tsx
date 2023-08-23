import { Title } from "@solidjs/meta";
import { createHandler, render, StartServer } from "@solidjs/start/server";

function Document(props) {
  return (
    <html lang="en">
      <head>
        <Title>SolidStart - With TailwindCSS</Title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {props.assets}
      </head>
      <body>
        <div id="app">{props.children}</div>
        {props.scripts}
      </body>
    </html>
  );
}

export default createHandler(
  render(context => <StartServer context={context} document={Document} />)
);
