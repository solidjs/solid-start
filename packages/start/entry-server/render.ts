import { JSX } from "solid-js";
import { renderToStream, renderToStringAsync } from "solid-js/web";
import { internalFetch } from "../api/internalFetch";
import { FetchEvent, FETCH_EVENT, PageEvent } from "../server/types";

export function renderAsync(
  fn: (context: PageEvent) => JSX.Element,
  options?: {
    timeoutMs?: number;
    nonce?: string;
    renderId?: string;
  }
) {
  return () => async (event: FetchEvent) => {
    let pageEvent = createPageEvent(event);

    let markup = await renderToStringAsync(() => fn(pageEvent), options);

    if (pageEvent.routerContext.url) {
      return Response.redirect(new URL(pageEvent.routerContext.url, pageEvent.request.url), 308);
    }

    if (import.meta.env.START_ISLANDS_ROUTER && pageEvent.routerContext.replaceOutletId) {
      markup = `${pageEvent.routerContext.replaceOutletId}:${
        pageEvent.routerContext.newOutletId
      }=${markup.slice(
        markup.indexOf(`<!--${pageEvent.routerContext.newOutletId}-->`) +
          `<!--${pageEvent.routerContext.newOutletId}-->`.length +
          `<outlet-wrapper id="${pageEvent.routerContext.newOutletId}">`.length,
        markup.lastIndexOf(`<!--${pageEvent.routerContext.newOutletId}-->`) -
          `</outlet-wrapper>`.length
      )}`;

      pageEvent.responseHeaders.set("Content-Type", "text/plain");
    }

    return new Response(markup, {
      status: pageEvent.getStatusCode(),
      headers: pageEvent.responseHeaders
    });
  };
}

function handleRedirect(context) {
  return ({ write }) => {
    if (context.routerContext.url)
      write(`<script>window.location="${context.routerContext.url}"</script>`);
  };
}

function createPageEvent(event: FetchEvent) {
  let responseHeaders = new Headers({
    "Content-Type": "text/html"
  });

  const prevPath = event.request.headers.get("x-solid-referrer");

  let statusCode = 200;

  function setStatusCode(code: number) {
    statusCode = code;
  }

  function getStatusCode() {
    return statusCode;
  }

  const pageEvent: PageEvent = Object.freeze({
    request: event.request,
    prevUrl: prevPath,
    routerContext: {},
    tags: [],
    env: event.env,
    $type: FETCH_EVENT,
    responseHeaders,
    setStatusCode: setStatusCode,
    getStatusCode: getStatusCode,
    fetch: internalFetch
  });

  return pageEvent;
}

export function renderStream(
  fn: (context: PageEvent) => JSX.Element,
  baseOptions: {
    nonce?: string;
    renderId?: string;
    onCompleteShell?: (info: { write: (v: string) => void }) => void;
    onCompleteAll?: (info: { write: (v: string) => void }) => void;
  } = {}
) {
  return () => async (event: FetchEvent) => {
    let pageEvent = createPageEvent(event);

    const options = { ...baseOptions };
    if (options.onCompleteAll) {
      const og = options.onCompleteAll;
      options.onCompleteAll = options => {
        handleRedirect(pageEvent)(options);
        og(options);
      };
    } else options.onCompleteAll = handleRedirect(pageEvent);
    const { readable, writable } = new TransformStream();
    const stream = renderToStream(() => fn(pageEvent), options);

    if (pageEvent.routerContext.url) {
      return Response.redirect(new URL(pageEvent.routerContext.url, pageEvent.request.url), 308);
    }

    if (pageEvent.routerContext.replaceOutletId) {
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      writer.write(
        encoder.encode(
          `${pageEvent.routerContext.replaceOutletId}:${pageEvent.routerContext.newOutletId}=`
        )
      );
      writer.releaseLock();
      pageEvent.responseHeaders.set("Content-Type", "text/plain");
    }

    stream.pipeTo(writable);

    return new Response(readable, {
      status: pageEvent.getStatusCode(),
      headers: pageEvent.responseHeaders
    });
  };
}
