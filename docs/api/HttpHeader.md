---
section: api
title: HttpHeader
order: 10
subsection: Document
---

# HttpHeader

```tsx twoslash
import { HttpHeader, HttpStatusCode } from "solid-start";
// ---cut---
export default function NotFound() {
  return (
    <div>
      <HttpStatusCode code={404} />
      <HttpHeader name="my-header" value="header-value" />
    </div>
  );
}
```

As you render the page you may want to add additional headers. The `HttpHeader` component will do that for you. You can pass it a `name` and `value` and that will get added to the `Response` headers sent back to the browser.

Keep in mind, when streaming responses(`renderStream`), HTTP headers can only be included that are added before the stream first flushed. Be sure to add `deferStream` to any resources or `createServerData$` calls that needed to be loaded before responding.