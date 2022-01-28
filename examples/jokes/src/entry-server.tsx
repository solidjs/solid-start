import { renderToStream, renderToStringAsync } from "solid-js/web";
import {
  StartServer,
  createHandler,
  RequestContext,
} from "solid-start/components";
import { inlineServerModules } from "solid-start/server";

export const streamPage = () => {
  return async ({
    request,
    manifest,
    headers,
    context = {},
  }: RequestContext) => {
    // streaming
    const { readable, writable } = new TransformStream();
    renderToStream(() => (
      <StartServer context={context} url={request.url} manifest={manifest} />
    )).pipeTo(writable);

    headers.set("Content-Type", "text/html");

    return new Response(readable, {
      status: 200,
      headers,
    });
  };
};

export const renderPageToString = () => {
  return async ({
    request,
    manifest,
    headers,
    context = {},
  }: RequestContext) => {
    const str = await renderToStringAsync(() => (
      <StartServer context={context} url={request.url} manifest={manifest} />
    ));

    headers.set("Content-Type", "text/html");

    return new Response(str, {
      status: 200,
      headers,
    });
  };
};

export default createHandler(inlineServerModules, renderPageToString);
