import { renderToStream } from "solid-js/web";
import { StartServer, createHandler } from "solid-start/components";
import { inlineServerModules } from "solid-start/server";

const renderPage = () => {
  return async ({ request, manifest, headers, context = {} }) => {
    // streaming
    const { readable, writable } = new TransformStream();
    renderToStream(() => (
      <StartServer context={context} url={request.url} manifest={manifest} />
    )).pipeTo(writable);

    headers.set("Content-Type", "text/html");

    return new Response(readable, {
      status: 200,
      headers
    });
  };
};

export default createHandler(inlineServerModules, renderPage);
