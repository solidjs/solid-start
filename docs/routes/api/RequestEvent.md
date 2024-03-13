---
section: api
title: RequestEvent
order: 99
subsection: Server
active: true
---

# RequestEvent

Solid uses Async Local Storage on the server as a way of injecting the request context anywhere on the server. This is also the event that shows up in middleware.

It can be retrieved via the `getRequestEvent` call from `"solid-js/web"`. That is right the core event is available in libraries as well but we extend it for SolidStart's purposes.

```js
import { getRequestEvent } from "solid-js/web";

const event = getRequestEvent();
```

## Request

The most important property of the `RequestEvent` is `.request`. This is a Web [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object that represents the current request to the server. You can access all the properties off of it like `url` and `headers`. The `body` usually does not need to be handled directly for things like server functions or rendering which already handle mapping it.

```js
import { getRequestEvent } from "solid-js/web";

const event = getRequestEvent();
if (event) {
  const auth = event.request.headers.get("Authorization")
}
```

## Response

The `RequestEvent` also can be used to stub out the Response. We extend the options that one would pass to the [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#options) constructor. This is kept up to date so it can be used to read and write headers and status for the current response.

```js
import { getRequestEvent } from "solid-js/web";

const event = getRequestEvent();
if (event) {
  event.response.headers.append("Set-Cookie", "foo=hello");
  event.response.status = 201;
}
```

### Returning a Response vs updating the Response on the event

The event is considered global and lasts the life of the request. Therefore whether you are calling a server function on the server during SSR or via an RPC call setting values on `event.response` will reflect on that request.

Whereas the returned response will only impact the response when it is an RPC call. This is important because some headers you might want to set you may not want to set for the whole page and only for the specific request.

Keep this in mind when choosing where to set headers and responses.

## Locals

SolidStart uses `event.locals` to pass around local context to be used as you see fit.

When adding fields to `event.locals`, you can let Typescript know the types of these fields like so:

```tsx
declare module "@solidjs/start/server" {
  interface RequestEventLocals {
    myNumber: number;
    someString: string;
  }
}
```

## nativeEvent

Sometimes you still need access to the underlying event from Vinxi. You can access that using the `.nativeEvent` property. It is the underlying H3Event used and can be passed to the helpers available in the ecosystem. Keep in mind that Vinxi HTTP helpers do not treeshake so you can only import them in files that do not contain client or isomorphic code.

Many of these events support Async Local Storage so this may not be needed.
