import { createHandler, Middleware, renderAsync, StartServer } from "../entry-server";

export default createHandler(renderAsync(event => <StartServer event={event} />) as unknown as Middleware);
