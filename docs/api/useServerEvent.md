---
section: api
title: useServerContext
order: 8
subsection: Server
active: true
---

# useServerContext

##### `useServerContext` gives you access to the `PageEvent` received by the server.

<div class="text-lg">

```tsx twoslash
import { useServerContext } from "solid-start";
// ---cut---
const serverContext = useServerContext();
```

</div>

<table-of-contents></table-of-contents>

## Usage

`useServerContext` is a hook that gives you access to the `PageEvent` received by the server.

### Accessing the `request` on the server

One common use case of this is to get the cookies. Cookies can be used to save user-preferences as session data. These preferences can be used to personalize the page on the server and the client identically. 

```tsx twoslash 
import { parseCookie, useServerContext } from "solid-start";
import { isServer } from "solid-js/web";

function Component() {
  const event = useServerContext();
  const cookie = () => parseCookie(
    isServer 
    ? event.request.headers.get("cookie") ?? ""
    : document.cookie
  );
  return <div>{JSON.stringify(cookie())}</div>;
}
```

<aside type="warning">
Be careful to not access the server-side fields of the `ServerContext`. You should usually wrap the usage in `isServer` to ensure that the code is not executed on the client. You also get access to the page event as the second argument of `createServerData$` and `createServerAction$`. Since most times it's the data that needs to be personalized, you can use `createServerData$` to access the request object.
</aside>

## Reference

### `useServerContext()`

```ts
function Component() {
  const event = useServerContext();
  return <div>{JSON.stringify(event)}</div>;
}
```

Returns the `PageEvent` received by the server. The properties of the `PageEvent` are:

- `request`: The web standard [`Request`][Request] object.
- `fetch`: internal [`fetch`][fetch] function that can make requests to our own API routes locally.
- `responseHeaders`: The [`Headers`][Headers] object that will be sent to the client with the [`Response`][Response].
- `setStatusCode(code: number)`: A function to set the [status code][statuscode] of the [`Response`][Response].
- `getStatusCode()`: A function to get the [status code][statuscode] of the [`Response`][Response].

[Request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[Headers]: https://developer.mozilla.org/en-US/docs/Web/API/Headers
[statuscode]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
[Response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
