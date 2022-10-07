---
section: api
title: Html
order: 1
subsection: Document
---

# Html

```tsx twoslash
import { Html } from "solid-start";
// ---cut---
export default function Root() {
  return <Html lang="en">...</Html>;
}
```

The `Html` Component represents the root of our document and is a wrapper over the native `html` tag. It accepts any attributes assignable to the native `HTMLHtmlElement`. All rendered elements must be a descendant of `Html` and all server rendered elements under it unless also under `Body` are not hydrated.
