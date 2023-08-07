import { createHandler, renderStream, StartServer } from "solid-start/entry-server";

export default createHandler(renderStream(event => <StartServer event={event} />));
