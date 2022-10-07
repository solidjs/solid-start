---
section: api
title: HttpStatusCode
order: 11
subsection: Document
---

# HttpStatusCode

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

As you render the page you may want to set the status code to the `Response` depending on how it goes. The `HttpStatusCode` component will do that for you. You can pass `code` and that will be set as the `Response` status sent back to the browser.

Keep in mind, when streaming responses(`renderStream`), the HTTP Status can only be included if added before the stream first flushed. Be sure to add `deferStream` to any resources or `createServerData$` calls that needed to be loaded before responding.