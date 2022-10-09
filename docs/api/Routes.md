---
section: api
title: Routes
order: 2
subsection: Router
---

# Routes

```js
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

However, SolidStart provides file system routing which allows you to define the routes via a folder structure under the `/routes` folder. You can pass them into the `<Routes>` component with the `<FileRoutes>` component.

```tsx {6-8}
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


