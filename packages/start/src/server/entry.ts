import { createApp, toWebHandler } from "h3";
import serverEntry from "virtual:solid-start-server-entry";

export default {
  fetch: toWebHandler(createApp().use(serverEntry))
}
