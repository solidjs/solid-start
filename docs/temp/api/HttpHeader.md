---
section: api
title: HttpHeader
order: 10
subsection: Document
active: true
---

# HttpHeader

##### `HttpHeader` is a component that allows you set a header on the HTTP response sent by the server.

<div class="text-lg">

```tsx twoslash
import { HttpHeader } from "solid-start/server";
// ---cut---
<HttpHeader name="x-robots-tog" value="noindex" />
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Setting a header for catch-all routes

```tsx twoslash filename="routes/*404.tsx"
import { HttpHeader, HttpStatusCode } from "solid-start/server";

export default function NotFound() {
  return (
    <div>
      <HttpStatusCode code={404} />
      <HttpHeader name="my-header" value="header-value" />
    </div>
  );
}
```

As you render the page you may want to add additional HTTP headers to the response. The `HttpHeader` component will do that for you. You can pass it a `name` and `value` and that will get added to the `Response` headers sent back to the browser.

Keep in mind, when streaming responses(`renderStream`), HTTP headers can only be included that are added before the stream first flushed. Be sure to add `deferStream` to any resources or `createServerData$` calls that needed to be loaded before responding.

## Reference

### `<HttpHeader />`

Import from `solid-start/server` and use it anywhere in your component tree. It will add the header if that part of the tree is rendered on the server.

```tsx twoslash
import { HttpHeader } from "solid-start/server";

function Component() {
  return <HttpHeader name="my-header" value="header-value" />
}
```

#### Props

- `name` - The name of the header to set
- `value` - The value of the header to set