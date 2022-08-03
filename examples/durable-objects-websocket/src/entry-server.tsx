import { StartServer, createHandler, renderAsync } from "solid-start/entry-server";
import { WebSocketDurableObject } from "./do";

export { WebSocketDurableObject };

export default createHandler(renderAsync(event => <StartServer event={event} />));
