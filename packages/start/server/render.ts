import { JSX } from "solid-js";
import { renderToStream, renderToString, renderToStringAsync } from "solid-js/web";
import { apiRoutes } from "../api/middleware";
import { inlineServerFunctions } from "../server/middleware";
import { redirect } from "../server/responses";
import { FetchEvent, FETCH_EVENT, PageEvent } from "../server/types";

export function renderSync(
  fn: (context: PageEvent) => JSX.Element,
  options?: {
    nonce?: string;
    renderId?: string;
  }
) {
  return () => apiRoutes({
    forward: inlineServerFunctions({
      async forward(event: FetchEvent): Promise<Response> {
        if (
          !import.meta.env.DEV &&
          !import.meta.env.START_SSR &&
          !import.meta.env.START_INDEX_HTML
        ) {
          return (
            (await event.env.getStaticHTML?.("/index")) ?? new Response("Not Found", { status: 404 })
          );
        }

        let pageEvent = createPageEvent(event);

        let markup = renderToString(() => fn(pageEvent), options);
        if (pageEvent.routerContext && pageEvent.routerContext.url) {
          return redirect(pageEvent.routerContext.url, {
            headers: pageEvent.responseHeaders
          });
        }

        markup = handleIslandsRouting(pageEvent, markup);

        return new Response(markup, {
          status: pageEvent.getStatusCode(),
          headers: pageEvent.responseHeaders
        });
      }
    })
  });
}

export function renderAsync(
  fn: (context: PageEvent) => JSX.Element,
  options?: {
    timeoutMs?: number;
    nonce?: string;
    renderId?: string;
  }
) {
  return () => apiRoutes({
    forward: inlineServerFunctions({
      async forward(event: FetchEvent): Promise<Response> {
        if (
          !import.meta.env.DEV &&
          !import.meta.env.START_SSR &&
          !import.meta.env.START_INDEX_HTML
        ) {
          return (
            (await event.env.getStaticHTML?.("/index")) ?? new Response("Not Found", { status: 404 })
          );
        }

        let pageEvent = createPageEvent(event);

        let markup = await renderToStringAsync(() => fn(pageEvent), options);

        if (pageEvent.routerContext && pageEvent.routerContext.url) {
          return redirect(pageEvent.routerContext.url, {
            headers: pageEvent.responseHeaders
          }) as Response;
        }

        markup = handleIslandsRouting(pageEvent, markup);

        return new Response(markup, {
          status: pageEvent.getStatusCode(),
          headers: pageEvent.responseHeaders
        });
      }
    })
  });
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
  return () => apiRoutes({
    forward: inlineServerFunctions({
      async forward(event: FetchEvent): Promise<Response> {
        if (
          !import.meta.env.DEV &&
          !import.meta.env.START_SSR &&
          !import.meta.env.START_INDEX_HTML
        ) {
          return (
            (await event.env.getStaticHTML?.("/index")) ?? new Response("Not Found", { status: 404 })
          );
        }

        let pageEvent = createPageEvent(event);

        // Hijack after navigation with islands router to be async
        // Todo streaming into HTML
        if (import.meta.env.START_ISLANDS_ROUTER && event.request.headers.get("x-solid-referrer")) {
          let markup = await renderToStringAsync(() => fn(pageEvent), baseOptions);

          if (pageEvent.routerContext && pageEvent.routerContext.url) {
            return redirect(pageEvent.routerContext.url, {
              headers: pageEvent.responseHeaders
            }) as Response;
          }

          markup = handleIslandsRouting(pageEvent, markup);

          return new Response(markup, {
            status: pageEvent.getStatusCode(),
            headers: pageEvent.responseHeaders
          });
        }

        const options = { ...baseOptions };
        if (options.onCompleteAll) {
          const og = options.onCompleteAll;
          options.onCompleteAll = options => {
            handleStreamingRedirect(pageEvent)(options);
            og(options);
          };
        } else options.onCompleteAll = handleStreamingRedirect(pageEvent);
        const { readable, writable } = new TransformStream();
        const stream = renderToStream(() => fn(pageEvent), options);

        if (pageEvent.routerContext && pageEvent.routerContext.url) {
          return redirect(pageEvent.routerContext.url, {
            headers: pageEvent.responseHeaders
          });
        }

        handleStreamingIslandsRouting(pageEvent, writable);

        stream.pipeTo(writable);

        return new Response(readable, {
          status: pageEvent.getStatusCode(),
          headers: pageEvent.responseHeaders
        });
      }
    })
  });
}

function handleStreamingIslandsRouting(pageEvent: PageEvent, writable: WritableStream<any>) {
  if (pageEvent.routerContext && pageEvent.routerContext.replaceOutletId) {
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
}

function handleRedirect() {}

function handleStreamingRedirect(context: PageEvent) {
  return ({ write }: { write: (html: string) => void }) => {
    if (context.routerContext && context.routerContext.url)
      write(`<script>window.location="${context.routerContext.url}"</script>`);
  };
}

function createPageEvent(event: FetchEvent) {
  let responseHeaders = new Headers({
    "Content-Type": "text/html"
  });

  const prevPath = event.request.headers.get("x-solid-referrer");
  const mutation = event.request.headers.get("x-solid-mutation") === "true";

  let statusCode = 200;

  function setStatusCode(code: number) {
    statusCode = code;
  }

  function getStatusCode() {
    return statusCode;
  }

  const pageEvent: PageEvent = {
    request: event.request,
    prevUrl: prevPath || "",
    routerContext: {} as any,
    mutation: mutation,
    tags: [],
    env: event.env,
    clientAddress: event.clientAddress,
    locals: event.locals,
    $type: FETCH_EVENT,
    responseHeaders,
    setStatusCode: setStatusCode,
    getStatusCode: getStatusCode,
    $islands: new Set<string>(),
    fetch: event.fetch
  };

  return pageEvent;
}

function handleIslandsRouting(pageEvent: PageEvent, markup: string) {
  if (pageEvent.mutation) {
    pageEvent.routerContext.replaceOutletId = "outlet-0";
    pageEvent.routerContext.newOutletId = "outlet-0";
  }
  if (import.meta.env.START_ISLANDS_ROUTER && pageEvent.routerContext?.replaceOutletId) {
    markup = `${
      pageEvent.routerContext.assets
        ? `assets=${JSON.stringify(pageEvent.routerContext.assets)};`
        : ``
    }${pageEvent.routerContext.replaceOutletId}:${pageEvent.routerContext.newOutletId}=${
      pageEvent.routerContext.partial
        ? markup
        : markup.slice(
            markup.indexOf(`<!--${pageEvent.routerContext.newOutletId}-->`) +
              `<!--${pageEvent.routerContext.newOutletId}-->`.length +
              `<outlet-wrapper id="${pageEvent.routerContext.newOutletId}">`.length,
            markup.lastIndexOf(`<!--${pageEvent.routerContext.newOutletId}-->`) -
              `</outlet-wrapper>`.length
          )
    }`;

    let url = new URL(pageEvent.request.url);
    pageEvent.responseHeaders.set("Content-Type", "text/solid-diff");
    pageEvent.responseHeaders.set("x-solid-location", url.pathname + url.search + url.hash);
  }

  if (import.meta.env.START_ISLANDS_ROUTER && pageEvent.mutation) {
    let url = new URL(pageEvent.request.url);
    pageEvent.responseHeaders.set("Content-Type", "text/solid-diff");
    pageEvent.responseHeaders.set("x-solid-location", url.pathname + url.search + url.hash);
  }
  return markup;
}
