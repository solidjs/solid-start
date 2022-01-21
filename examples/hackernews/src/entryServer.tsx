import { renderToStream } from "solid-js/web";
import { StartServer } from "solid-start/components";

export default async function handleRequest({
  request,
  manifest,
  headers,
  context = {}
}: {
  request: Request;
  headers: Response["headers"];
  manifest: Record<string, any>;
  context?: Record<string, any>;
}) {
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
