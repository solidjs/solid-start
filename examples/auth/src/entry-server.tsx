import { renderToStringAsync } from "solid-js/web";
import { StartServer, createHandler } from "solid-start/components";
import { inlineServerModules } from "solid-start/server";

function renderPage() {
  return async ({
    request,
    manifest,
    responseHeaders,
    context = {}
  }: {
    request: Request;
    responseHeaders: Response["headers"];
    manifest: Record<string, any>;
    context?: Record<string, any>;
  }) => {
    console.log(request, responseHeaders, manifest, context);
    let markup = await renderToStringAsync(() => (
      <StartServer
        context={{ ...context, request, responseHeaders }}
        url={request.url}
        manifest={manifest}
      />
    ));

    responseHeaders.set("content-type", "text/html");

    return new Response(markup, {
      status: 200,
      headers: responseHeaders
    });
  };
}

export default createHandler(inlineServerModules, renderPage);
