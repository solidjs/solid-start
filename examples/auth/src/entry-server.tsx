import { renderToStringAsync } from "solid-js/web";
import { StartServer, createHandler } from "solid-start/components";
import { inlineServerModules } from "solid-start/server";

function renderPage() {
  return async ({
    request,
    manifest,
    pageHeaders,
    context = {}
  }: {
    request: Request;
    pageHeaders: Response["headers"];
    manifest: Record<string, any>;
    context?: Record<string, any>;
  }) => {
    console.log(request, pageHeaders, manifest, context);
    let markup = await renderToStringAsync(() => (
      <StartServer
        context={{ ...context, request, pageHeaders }}
        url={request.url}
        manifest={manifest}
      />
    ));

    pageHeaders.set("content-type", "text/html");

    return new Response(markup, {
      status: 200,
      headers: pageHeaders
    });
  };
}

export default createHandler(inlineServerModules, renderPage);
