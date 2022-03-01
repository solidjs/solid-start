import { renderToStream } from "solid-js/web";
import { StartServer, createHandler, RequestContext } from "solid-start/components";
import { inlineServerModules } from "solid-start/server";

const renderPage = () => {
  return async (context: RequestContext) => {
    // streaming
    const { readable, writable } = new TransformStream();
    renderToStream(() => <StartServer context={context} />).pipeTo(writable);

    context.responseHeaders.set("Content-Type", "text/html");

    return new Response(readable, {
      status: 200,
      headers: context.responseHeaders
    });
  };
};

export default createHandler(inlineServerModules, renderPage);
