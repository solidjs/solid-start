import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";
export { WebSocketDurableObject } from "solid-start/websocket";

export default createHandler(renderAsync(event => <StartServer event={event} />));
