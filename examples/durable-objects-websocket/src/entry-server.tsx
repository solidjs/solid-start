import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";
export { WebSocketDurableObject } from "solid-start/websocket/do";

export default createHandler(renderAsync(event => <StartServer event={event} />));
