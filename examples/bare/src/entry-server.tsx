import { createHandler, render, StartServer } from "solid-start/entry-server";

export default createHandler(render(event => <StartServer event={event} />));
