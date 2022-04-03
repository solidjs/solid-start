import { StartServer, createHandler, renderAsync } from "solid-start/entry-server";
import { inlineServerModules } from "solid-start/server";
import { apiRoutes } from "solid-start/api";

export default createHandler(
  apiRoutes,
  inlineServerModules,
  renderAsync(context => <StartServer context={context} />)
);
