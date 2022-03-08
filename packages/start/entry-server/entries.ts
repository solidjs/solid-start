import { JSX } from "solid-js";
import { renderToStringAsync, renderToStream } from "solid-js/web";
import { RequestContext } from "./StartServer";

export function renderAsync(
  fn: (context: RequestContext) => JSX.Element,
  options?: {
    timeoutMs?: number;
    nonce?: string;
    renderId?: string;
  }
) {
  return () => async (context: RequestContext) => {
    let markup = await renderToStringAsync(() => fn(context), options);
    if (context.routerContext.url) {
      return Response.redirect(new URL(context.routerContext.url, context.request.url), 302);
    }

    context.responseHeaders.set("content-type", "text/html");

    return new Response(markup, {
      status: 200,
      headers: context.responseHeaders
    });
  };
}

function handleRedirect(context) {
  return ({ write }) => {
    // if (context.routerContext.url) write(`<script>window.location="${context.routerContext.url}"</script>`);
  };
}

export function renderStream(
  fn: (context: RequestContext) => JSX.Element,
  options: {
    nonce?: string;
    renderId?: string;
    onCompleteShell?: (info: { write: (v: string) => void }) => void;
    onCompleteAll?: (info: { write: (v: string) => void }) => void;
  } = {}
) {
  return () => async (context: RequestContext) => {
    options = { ...options };
    if (options.onCompleteAll) {
      const og = options.onCompleteAll;
      options.onCompleteAll = options => {
        handleRedirect(context)(options);
        og(options);
      };
    } else options.onCompleteAll = handleRedirect(context);
    const { readable, writable } = new TransformStream();
    renderToStream(() => fn(context), options).pipeTo(writable);
    if (context.routerContext.url) {
      return Response.redirect(new URL(context.routerContext.url, context.request.url), 302);
    }

    context.responseHeaders.set("Content-Type", "text/html");

    return new Response(readable, {
      status: 200,
      headers: context.responseHeaders
    });
  };
}
