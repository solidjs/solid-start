---
section: api
title: HttpStatusCode
order: 11
subsection: Document
---

# HttpStatusCode

```tsx twoslash {6} filename="routes/*404.tsx"
import { HttpStatusCode } from "solid-start/server";

export default function NotFound() {
  return (
    <div>
      <HttpStatusCode code={404} />
      <h1>Page not found</h1>
    </div>
  );
}
```

As you render the page you may want to set the status code to the `Response` depending on how it goes. The `HttpStatusCode` component will do that for you. You can pass `code` and that will be set as the `Response` status sent back to the browser.

Keep in mind, when streaming responses(`renderStream`), the HTTP Status can only be included if added before the stream first flushed. Be sure to add `deferStream` to any resources or `createServerData$` calls that needed to be loaded before responding.

### Setting status code 404 for missing pages

When you use dynamic params in routes, you may want to set a 404 status code if the given parameter for a segment points to a missing resource. Usually, you will find out that the param is missing when you do some async request with that param. So you are probably inside a resource fetcher, either in `createServerData$`, or `createResource`. You can throw errors from inside these fetchers which will be caught by `<ErrorBoundary>` componnts. `<HttpStatusCode>` pairs very well with error boundaries. You can inspect the error in the ErrorBoundary's fallback, and render a `<HttpStatusCode code={404} />` if the fetcher throws an error indicating the data was not found.


```tsx twoslash {8,18-23} filename="routes/[house].tsx"
import { Show } from 'solid-js';
import { ErrorBoundary, useRouteData, RouteDataArgs, ErrorMessage } from 'solid-start'
import { HttpStatusCode, createServerData$, ServerError } from "solid-start/server";

export function routeData({ params }: RouteDataArgs) {
  return createServerData$(async (house: string) => {
    if (house != 'griffindor') {
      throw new ServerError('House not found')
    }
    return { house }
  }, { key: () => params.house, deferStream: true });
}

export default function House() {
  const house = useRouteData<typeof routeData>();
  return (
    <ErrorBoundary 
      fallback={e => (
        <Show when={e.message === 'House not found'}>
          <HttpStatusCode code={404} />
          <ErrorMessage error={e} />
        </Show>
      )}
    >
      <div>
        Gryffindor
      </div>
    </ErrorBoundary>
  );
}

```