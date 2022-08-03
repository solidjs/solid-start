import { createHandler, renderAsync, StartServer } from "../entry-server";

export default createHandler(renderAsync(event => <StartServer event={event} />));
