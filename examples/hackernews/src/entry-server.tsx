import { renderToStream } from "solid-js/web";
import { StartServer } from "solid-start/components";

interface RequestContext {
  request: Request;
  headers: Response["headers"];
  manifest: Record<string, any>;
  context?: Record<string, any>;
}

function createHandler() {
  return (ctx: RequestContext) => {
    const url = new URL(ctx.request.url);

    if (url.pathname.startsWith("/__server_module")) {
      return new Response("", { status: 404 });
    }

    return solidPage(ctx);
  };
}

async function solidPage({ request, manifest, headers, context = {} }: RequestContext) {
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
}

export default createHandler();
