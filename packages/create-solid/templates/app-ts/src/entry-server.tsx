import { renderToStringAsync } from "solid-js/web";
import { StartServer, createHandler } from "solid-start/components";
import { inlineServerModules } from "solid-start/server";

function renderPage() {
  return async ({
    request,
    manifest,
    headers,
    context = {}
  }: {
    request: Request;
    headers: Response["headers"];
    manifest: Record<string, any>;
    context?: Record<string, any>;
  }) => {
    let markup = await renderToStringAsync(() => (
      <StartServer context={context} url={request.url} manifest={manifest} />
    ));

    headers.set("Content-Type", "text/html");

    return new Response(markup, {
      status: 200,
      headers
    });
  };
}

export default createHandler(inlineServerModules, renderPage);
