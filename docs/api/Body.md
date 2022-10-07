---
section: api
title: Body
order: 7
subsection: Document
---

# Body

```tsx
import { Html, Body, Routes, FileRoutes } from "solid-start";

export default function Root() {
  return (
    <Html>
      <Body>
        <MyNav />
        <Routes>
          <FileRoutes />
        </Routes>
      </Body>
    </Html>
  );
}
```

The `Body` component is the entry point into our applications. Here is where we insert the top level visual elements of our page live, as well as things like our `Routes` definition. It wraps the `body` element and accepts all the same attributes.

It is also the starting point for hydration for general Server-Side rendering and root of client rendering for non-SSR mode.
