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
    headers.set("content-type", "text/html");

    let markup = await renderToStringAsync(() => (
      <StartServer context={context} url={request.url} manifest={manifest} />
    ));

    console.log(headers.get("content-type"), headers.get("x-solidstart-status-code"));

    if (headers.get("x-solidstart-status-code")) {
      console.log("x-solidstart-status-code", headers.get("x-solidstart-status-code"));
      return new Response(markup, {
        status: Number(headers.get("x-solidstart-status-code")),
        headers
      });
    }

    return new Response(markup, {
      status: 200,
      headers
    });
  };
}

export default createHandler(inlineServerModules, renderPage);
