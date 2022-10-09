---
section: api
title: FileRoutes
order: 8
subsection: Router
---

# FileRoutes

The `<FileRoutes>` component collects routes from the file system in the `/routes` folder to be inserted into a parent `<Routes>` component.

```tsx twoslash {7-9} filename="root.tsx"
import { Html, Body, Routes, FileRoutes } from "solid-start";

export default function Root() {
  return (
    <Html>
      <Body>
        <Routes>
          <FileRoutes />
        </Routes>
      </Body>
    </Html>
  );
}
```

See the [routing guide](/core-concepts/routing) for more details.
