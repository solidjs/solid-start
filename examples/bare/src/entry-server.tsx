import { createHandler, render, StartServer } from "@solidjs/start/server";

function Document(props) {
  return (
    <html lang="en">
      <head>
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
