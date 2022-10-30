import { json } from "solid-start";
import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";


export default createHandler(renderAsync(event => <StartServer event={event} />));
