---
section: api
title: HttpStatusCode
order: 11
subsection: Document
active: true
---

# HttpStatusCode

##### `HttpStatusCode` is a component that sets the HTTP status code for the page response while server-side rendering.

<div class="text-lg">

```tsx twoslash
import { HttpStatusCode } from "solid-start/server";
// ---cut---
<HttpStatusCode code={404} />
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Setting a 404 status code for the unmatched routes

As you render the page you may want to set the status code to the `Response` depending on how it goes. The `HttpStatusCode` component will do that for you. You can pass `code` and that will be set as the `Response` status sent back to the browser.

Since `HttpStatusCode` is just a component, it can be used with `ErrorBoundaries`, `Show`, `Switch` or any of the other JSX control-flow components. So the same logic you are using to decide what to render should inform what status code you are setting. This allows that logic to sit together.

Status codes are important tools for things like caching and SEO, so it's a good practice to send meaningful status codes. For example, for a `NotFound` page, you should send a `404` status code.

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

### Setting a 404 status code for missing pages for dynamic routes

When you use dynamic params in routes, you may want to set a 404 status code if the given parameter for a segment points to a missing resource. Usually, you will find out that the param is missing when you do some async request with that param. You are probably inside a resource fetcher, either in `createServerData$`, or `createResource`. 

You can throw errors from inside these fetchers. These will be caught by the nearest `<ErrorBoundary>` component from where the data is accessed. `<HttpStatusCode>` pairs very well with error boundaries. You can inspect the error in the ErrorBoundary's fallback. If the fetcher throws an error indicating the data was not found, render a `<HttpStatusCode code={404} />`.

Keep in mind, when streaming responses (`renderStream`), the HTTP Status can only be included if added before the stream first flushed. Be sure to add `deferStream` to any resources or `createServerData$` calls that needed to be loaded before responding.

```tsx twoslash {8,18-23} filename="routes/[house].tsx"
import { Show } from 'solid-js';
import { ErrorBoundary, useRouteData, RouteDataArgs, ErrorMessage } from 'solid-start';
import { HttpStatusCode, createServerData$, ServerError } from "solid-start/server";

export function routeData({ params }: RouteDataArgs) {
  return createServerData$(async (house: string) => {
    if (house != 'gryffindor') {
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
