import { createHandler, StartServer } from "@solidjs/start/entry-server";

export default createHandler((context) => <StartServer context={context} />);
