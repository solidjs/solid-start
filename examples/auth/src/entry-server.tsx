import { renderToStringAsync } from "solid-js/web";
import { StartServer, createHandler, RequestContext } from "solid-start/components";
import { inlineServerModules } from "solid-start/server";

function renderPage() {
  return async (context: RequestContext) => {
    let markup = await renderToStringAsync(() => <StartServer context={context} />);

    context.responseHeaders.set("content-type", "text/html");

    return new Response(markup, {
      status: 200,
      headers: context.responseHeaders
    });
  };
}

export default createHandler(inlineServerModules, renderPage);
