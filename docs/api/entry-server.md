---
section: api
title: entry-server.tsx
order: 8
subsection: Entrypoints
active: true
---

# entry-server.tsx

##### `entry-server.tsx` is where your app starts on the server.

<div class="text-lg">

```tsx twoslash
import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";

export default createHandler(renderAsync(event => <StartServer event={event} />));
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Rendering your application

This file does one thing. It starts your SolidStart application on the server. It does so by passing in our `<StartServer>` to a "render" function. SolidStart provides three:
- `renderSync`
- `renderAsync`
- `renderStream`

Respectively, each wraps Solid's rendering methods of rendering to a:
- `string`
- `Promise`
- `ReadableStream`

`createHandler` allows a mechanism for introducing middleware into our server rendering. See our [Middleware Guide](/advanced/middleware) for more information.

## Reference

### `renderAsync(codeFn, options)`

Middleware that calls Solid's `renderToStringAsync` under the hood. This asynchronously renders the application and responds when the page has fully been loaded and rendered. All Suspense and data loading on initial load happens on the server.

```tsx twoslash
import { createHandler, renderAsync, StartServer } from "solid-start/entry-server";

export default createHandler(renderAsync(event => <StartServer event={event} />));
```

### `renderStream(codeFn, options)`

Middleware that calls Solid's `renderToStream` under the hood. This asynchronously renders the application and starts responding as soon as it can. All Suspense and data loading on initial load happens on the server. This method is probably the most desired approach in many cases.

However, it requires client-side JavaScript enabled and consideration of when status and head meta tags are available as once streaming has begun they cannot be updated from the server. This requires careful usage of the `deferStream` option of our Resources(`createRouteData`, `createServerData$`, `createResource`).

```tsx twoslash
import { createHandler, renderStream, StartServer } from "solid-start/entry-server";

export default createHandler(renderStream(event => <StartServer event={event} />));
```

### `renderSync(codeFn, options)`

Middleware that calls Solid's `renderToString` under the hood. This synchronously renders the application and responds immediately. All Suspense and data loading on initial load is deferred to the browser. Probably not recommended unless you do not wish to load data from the server for some specific reason.

```tsx twoslash
import { createHandler, renderSync, StartServer } from "solid-start/entry-server";

export default createHandler(renderSync(event => <StartServer event={event} />));
```

#### Parameters

- `codeFn` (_function_): function that executes the application code.
- `mountEl` (_Node_ | _Document_): element to mount the application to.

### `<StartServer event={event} />`

Component that wraps our application root. It includes Context providers for Routing and MetaData. It takes the `Event` object that originates from our underlying runtime that includes information:

#### PageEvent

- `request (Request)`: The current request.
- `responseHeaders (Headers)`: The headers being built for the response.
- `setStatusCode(code: number)`: Sets the status code.
- `getStatusCode()`: Returns the current status code.
- `fetch(url: string, init: RequestInit)`: Fetch API that can call API helpers directly on the server.

### `createHandler(...middlewareFn)`

Registers custom middleware around handling the server request by registering middleware functions that have the signature:

```tsx
type MiddlewareFn = (event: FetchEvent) => Promise<Response> | Response;

function MyMiddleware({ forward }: { forward: MiddlewareFn }): MiddlewareFn {}
```
