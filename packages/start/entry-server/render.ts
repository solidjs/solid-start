import { JSX } from "solid-js";
import { renderToStringAsync, renderToStream } from "solid-js/web";
import { PageContext } from "../server/types";

export function renderAsync(
  fn: (context: PageContext) => JSX.Element,
  options?: {
    timeoutMs?: number;
    nonce?: string;
    renderId?: string;
  }
) {
  return () => async (context: PageContext) => {
    let markup = await renderToStringAsync(() => fn(context), options);
    if (context.routerContext.url) {
      return Response.redirect(new URL(context.routerContext.url, context.request.url), 302);
    }

    context.responseHeaders.set("Content-Type", "text/html");

    return new Response(markup, {
      status: 200,
      headers: context.responseHeaders
    });
  };
}

function handleRedirect(context) {
  return ({ write }) => {
    if (context.routerContext.url)
      write(`<script>window.location="${context.routerContext.url}"</script>`);
  };
}

export function renderStream(
  fn: (context: PageContext) => JSX.Element,
  baseOptions: {
    nonce?: string;
    renderId?: string;
    onCompleteShell?: (info: { write: (v: string) => void }) => void;
    onCompleteAll?: (info: { write: (v: string) => void }) => void;
  } = {}
) {
  return () => async (context: PageContext) => {
    const options = { ...baseOptions };
    if (options.onCompleteAll) {
      const og = options.onCompleteAll;
      options.onCompleteAll = options => {
        handleRedirect(context)(options);
        og(options);
      };
    } else options.onCompleteAll = handleRedirect(context);
    const { readable, writable } = new TransformStream();
    const stream = renderToStream(() => fn(context), options);
    if (context.routerContext.url) {
      return Response.redirect(new URL(context.routerContext.url, context.request.url), 302);
    }
    stream.pipeTo(writable);

    context.responseHeaders.set("Content-Type", "text/html");

    return new Response(readable, {
      status: 200,
      headers: context.responseHeaders
    });
  };
}
