---
section: api
title: Routes
order: 2
subsection: Router
---

# Routes

```tsx twoslash {9-13} filename="root.tsx"
// @filename: pages/Home.tsx
export default function Home() {
  return <h1>Home</h1>;
}

// @filename: pages/Users.tsx
export default function Users() {
  return <h1>Users</h1>;
}

// @filename: root.tsx
// ---cut---
import { Routes, Route } from "solid-start"

import Home from "./pages/Home"
import Users from "./pages/Users"

export default function App() {
  return <>
    <h1>My Site with Lots of Pages</h1>
    <Routes>
      <Route path="/" component={Home} />
      <Route path="/users" component={Users} />
      <Route path="/about" element={<div>This site was made with Solid</div>} />
    </Routes>
  </>
}
```

The `<Routes>` component is where the Routes are defined. It receives `<Route>` components as children that define the various pages of your application. The `<Routes>` component also serves as the insertion point for those pages.

Think of it as a `<Switch>` component which uses the `URLPattern` rules with the `path` to match which `Route` to render. And when the user navigates to a different link, switches to the new `Route` and renders it.

Manually importing all your routes can be tedious and error prone, so, SolidStart gives you file-system routing. This allows you to define the routes via a folder structure under the `/routes` folder. You can pass them into the `<Routes>` component with the `<FileRoutes>` component.

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


