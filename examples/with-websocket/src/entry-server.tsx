import { createDurableObject } from "solid-start/durable-object";
import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";
import ws from 'solid-start/websocket/handler';

export const DO_WEBSOCKET = createDurableObject(ws);

export default createHandler(renderAsync(event => <StartServer event={event} />));
