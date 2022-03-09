import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";
import { inlineServerModules } from "solid-start/server";

export default createHandler(
  inlineServerModules,
  renderAsync(context => <StartServer context={context} />)
);
