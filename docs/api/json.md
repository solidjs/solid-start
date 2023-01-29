---
section: api
title: json
order: 8
subsection: Server
active: true
---

# json

##### `json` is a helper function to send JSON HTTP `Response`s.

<div class="text-lg">

```tsx twoslash
import { json } from "solid-start";
// ---cut---
const response = json({ hello: "world" });
```

</div>

<table-of-contents></table-of-contents>

## Usage

`json` is a helper for sending [responses][Response] with content-type `application/json`. 

It is useful for sending JSON responses from API Routes.

```tsx twoslash
import { json } from "solid-start";

export function GET() {
  return json({ hello: "world" });
}
```

## Reference

### `json(data: any)`

Use `json()` to create a [`Response`][Response] by serializing a JSON object. It will set the [content-type][ContentType] to `application/json`. Basically wherever a [`Response`][Response] is expected, it is useful inside.

For example:

- [API Routes](/core-concepts/api-routes)
- [`server$`](/api/server$) functions
- [Middleware](/advanced/middleware)

```ts twoslash
import { json } from "solid-start";

const response = json({ hello: "world" });
```

[Response]: https://developer.mozilla.org/en-US/docs/Web/API/Response
[ContentType]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type
