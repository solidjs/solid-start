---
section: api
title: FileRoutes
order: 8
subsection: Router
active: true
---

# FileRoutes

`FileRoutes` is a component that renders a [`Route`][route] for each file in the `routes` directory.

<div class="text-lg">

```tsx twoslash
import { FileRoutes } from "@solidjs/start";
<FileRoutes />;
```

</div>

<table-of-contents></table-of-contents>

## Usage

### Using file-based routing to set up your `Routes`

The `<FileRoutes>` component collects routes from the file-system in the `/routes` folder to be inserted into a parent `<Routes>` component.

Since `FileRoutes` returns a route configuration, it must be placed directly inside a `<Routes>`, usually the one in your `root.tsx` file.

```tsx twoslash {7-9} filename="app.tsx"
import { Suspense } from "solid-js";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start";

export default function App() {
  return (
    <Router root={props => <Suspense>{props.children}</Suspense>}>
      <FileRoutes />
    </Router>
  );
}
```

<aside>

Be careful before you decide to remove the `FileRoutes` component from your `app.tsx` file. If you do, you will need to manually add all of your routes to the `<Routes>` component.

You will still lose out on some optimizations that are enabled by file-system routing. While we will caution you however, always be free to explore what you can do.

</aside>

See the [routing guide](/core-concepts/routing) for more details.

[route]: /api/Route
