---
section: api
title: redirect
order: 8
subsection: Server
active: true
---

# redirect

##### `redirect` is a helper to create redirect [`Response`][Response] objects.

<div class="text-lg">

```tsx twoslash
import { redirect } from "solid-start/server";
// ---cut---
redirect("/my-next-destination");
```

</div>

<table-of-contents></table-of-contents>

## Usage

`redirect` is a helper for creating [responses][Response] objects with the `Location` header and a redirect status code. It is useful for sending redirects from `createServerData$`, `createServerAction$` and their variants. [API Routes][APIRoutes] can also use it to send redirects.

```tsx twoslash
import { redirect } from "solid-start/server";

export function GET() {
  return redirect('/some/other/path');
}
```

## Reference

### `redirect(location: string)`

Use `redirect('/somewhere')` to create a [`Response`][Response] that's going to redirect the user to `/somewhere`. It will set the [Location][Location] header. Basically wherever a [`Response`][Response] is expected, it is useful inside.

For example:

- [API Routes](/core-concepts/api-routes)
- [`server$`](/api/server$) functions
- [Middleware](/advanced/middleware)

```ts twoslash
import { redirect } from "solid-start/server";

const response = redirect('/somewhere');
```

[Response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[ContentType]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
[APIRoutes]: /core-concepts/api-routes
[Location]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Location
